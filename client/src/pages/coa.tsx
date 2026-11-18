import { Fragment, useEffect, useMemo, useReducer, useRef, useState, type RefObject } from "react";
import {
  CANNABINOID_KEYS,
  CANNABINOID_LABELS,
  SAFETY_LABELS,
  SAFETY_PANELS,
  coaRecordLabel,
  compareCoas,
  comparisonToCsv,
  comparisonToJson,
  formatMeasure,
  formatSafety,
  parseCoaText,
  parsedCoaSchema,
  type CoaLibraryRecord,
  type Comparison,
  type ParsedCoa,
} from "@shared/coa";
import { COA_SAMPLES } from "@shared/coa-samples";
import {
  coaWorkspaceRecords,
  coaWorkspaceReducer,
  initialCoaWorkspace,
  type CoaWorkspaceEvent,
  type CoaWorkspaceState,
} from "@shared/coa-workspace-machine";
import { SiteLayout, usePageTitle } from "@/components/site/chrome";

const TOKEN_KEY = "cs_admin_token";
const AGE_KEY = "cs_coa_age";
const LIBRARY_KEY = "cs_coa_library";

const fieldClass = "mt-2 w-full rounded-md border border-[#cfc6b6] bg-white px-3 py-3 text-base text-[#14211c]";

function isLibraryRecord(value: unknown): value is CoaLibraryRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CoaLibraryRecord>;
  return typeof record.id === "string"
    && (record.serverId == null || typeof record.serverId === "string")
    && parsedCoaSchema.safeParse(record.parsed).success;
}

function readLibrary(): CoaLibraryRecord[] {
  try {
    const raw = sessionStorage.getItem(LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLibraryRecord).slice(0, 24);
  } catch {
    return [];
  }
}

function mergeRecords(local: CoaLibraryRecord[], remote: CoaLibraryRecord[]): CoaLibraryRecord[] {
  const seen = new Set(local.flatMap((record) => [record.id, record.serverId].filter((id): id is string => Boolean(id))));
  const extra = remote.filter((record) => record.serverId != null && !seen.has(record.serverId) && !seen.has(record.id));
  return [...local, ...extra].slice(0, 24);
}

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CoaPage() {
  usePageTitle("Certificate reader — CannaSpecific");
  const [age, setAge] = useState(false);
  const [token, setToken] = useState("");
  const [workspace, dispatch] = useReducer(coaWorkspaceReducer, initialCoaWorkspace);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const [paste, setPaste] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = (event: CoaWorkspaceEvent) => {
    workspaceRef.current = coaWorkspaceReducer(workspaceRef.current, event);
    dispatch(event);
  };

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const savedAge = sessionStorage.getItem(AGE_KEY) === "yes";
    const savedToken = sessionStorage.getItem(TOKEN_KEY) ?? "";
    if (savedAge) setAge(true);
    if (savedToken) setToken(savedToken);
    if (savedAge && savedToken) void unlock(savedToken);
    return () => {
      meta.remove();
    };
  }, []);

  useEffect(() => {
    const records = coaWorkspaceRecords(workspace);
    if (!records || workspace.status === "parsing") return;
    sessionStorage.setItem(LIBRARY_KEY, JSON.stringify(records));
  }, [workspace]);

  async function unlock(nextToken = token) {
    if (coaWorkspaceReducer(workspaceRef.current, { type: "open" }) === workspaceRef.current) return;
    setActionError(null);
    send({ type: "open" });
    try {
      const response = await fetch("/api/coa/records", { headers: { "x-admin-token": nextToken } });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        send({ type: "openFailure", message: body?.message || "That token was not accepted." });
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, nextToken);
      const remote = Array.isArray(body?.data) ? body.data.filter(isLibraryRecord) : [];
      send({
        type: "openSuccess",
        records: mergeRecords(readLibrary(), remote),
        db: Boolean(body?.db),
        notice: body?.db ? null : (body?.message || "Database storage is off, so certificates stay in this browser tab."),
      });
    } catch {
      send({ type: "openFailure", message: "Could not reach the server." });
    }
  }

  function addRecord(record: CoaLibraryRecord) {
    setActionError(null);
    setFocusedId(record.id);
    setSelected((current) => current.includes(record.id) || current.length >= 4 ? current : [...current, record.id]);
    send({ type: "add", record });
  }

  async function readText(text: string, sourceName: string) {
    if (!age) return;
    if (coaWorkspaceReducer(workspaceRef.current, { type: "parse" }) === workspaceRef.current) return;
    setActionError(null);
    send({ type: "parse" });
    try {
      const response = await fetch("/api/coa/parse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ text, sourceName, ageConfirmed: true, remember: true }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data) {
        send({ type: "parseFailure", message: body?.message || "The certificate could not be read." });
        return;
      }
      const parsed = parsedCoaSchema.safeParse(body.data);
      if (!parsed.success) {
        send({ type: "parseFailure", message: "The reader returned a result this page could not use." });
        return;
      }
      const record: CoaLibraryRecord = {
        id: crypto.randomUUID(),
        serverId: body.saved?.id ?? null,
        parsed: parsed.data,
      };
      setFocusedId(record.id);
      setSelected((current) => current.length >= 4 ? current : [...current, record.id]);
      send({ type: "parseSuccess", record });
      if (body.message) setActionError(body.message);
    } catch {
      send({ type: "parseFailure", message: "Could not reach the server." });
    }
  }

  async function readFile(file: File) {
    if (!age) return;
    if (file.type && file.type !== "application/pdf") {
      setActionError("Upload a PDF, or paste the certificate text.");
      return;
    }
    if (coaWorkspaceReducer(workspaceRef.current, { type: "parse" }) === workspaceRef.current) return;
    setActionError(null);
    send({ type: "parse" });
    try {
      const response = await fetch(`/api/coa/parse?remember=1`, {
        method: "POST",
        headers: {
          "content-type": "application/pdf",
          "x-admin-token": token,
          "x-age-confirmed": "yes",
          "x-coa-filename": file.name,
        },
        body: await file.arrayBuffer(),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data) {
        send({ type: "parseFailure", message: body?.message || "The PDF could not be read." });
        return;
      }
      const parsed = parsedCoaSchema.safeParse(body.data);
      if (!parsed.success) {
        send({ type: "parseFailure", message: "The reader returned a result this page could not use." });
        return;
      }
      const record: CoaLibraryRecord = {
        id: crypto.randomUUID(),
        serverId: body.saved?.id ?? null,
        parsed: parsed.data,
      };
      setFocusedId(record.id);
      setSelected((current) => current.length >= 4 ? current : [...current, record.id]);
      send({ type: "parseSuccess", record });
      if (body.message) setActionError(body.message);
    } catch {
      send({ type: "parseFailure", message: "Could not reach the server." });
    }
  }

  function loadSample(id: string) {
    const sample = COA_SAMPLES.find((item) => item.id === id);
    if (!sample || !age) return;
    const record: CoaLibraryRecord = {
      id: `sample:${sample.id}`,
      serverId: null,
      parsed: parseCoaText(sample.text, {
        sourceName: `${sample.title} (sample)`,
        sourceKind: "sample",
      }),
    };
    addRecord(record);
  }

  async function removeRecord(record: CoaLibraryRecord) {
    setActionError(null);
    if (record.serverId) {
      const response = await fetch(`/api/coa/records/${record.serverId}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (!response.ok && response.status !== 404) {
        const body = await response.json().catch(() => null);
        setActionError(body?.message || "The saved copy could not be removed.");
        return;
      }
    }
    setSelected((current) => current.filter((id) => id !== record.id));
    send({ type: "remove", id: record.id });
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) {
        setActionError("Compare up to 4 certificates.");
        return current;
      }
      setActionError(null);
      return [...current, id];
    });
  }

  const records = coaWorkspaceRecords(workspace) ?? [];
  const open = workspace.status === "idle" || workspace.status === "parsing" || workspace.status === "error";
  const busy = workspace.status === "parsing" || workspace.status === "opening";
  const focused = records.find((record) => record.id === focusedId) ?? records[0] ?? null;
  const chosen = selected.flatMap((id) => {
    const record = records.find((item) => item.id === id);
    return record ? [record] : [];
  });
  const comparison = useMemo(() => {
    if (chosen.length < 2) return null;
    return compareCoas(chosen);
  }, [chosen]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8" data-coa-page={workspace.status}>
        <p className="kicker text-[#0f4d3a]">Private beta · 21+</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight md:text-5xl">Certificate reader</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#24312c]">
          Upload a cannabis lab certificate, or paste its text, and compare two to four of them. This reads the text layer of a PDF. It does not grade a product, predict how it will feel, or say whether it may be sold.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#24312c]">
          <strong>21+.</strong> CannaSpecific is for adults 21 and older. This page is not medical or health advice. It does not sell cannabis. Sample certificates are invented and are not documents from a real laboratory.
        </p>

        {!open && (
          <form
            className="mt-8 max-w-xl rounded-2xl border border-[#ddd4c4] bg-[#f7f4ec] p-5 md:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (!age) return;
              sessionStorage.setItem(AGE_KEY, "yes");
              void unlock();
            }}
          >
            <h2 className="font-heading text-2xl">Beta access</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#24312c]">
              This page is not public. Use the same admin token as the submissions page. The token stays in this browser tab.
            </p>
            <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={age}
                onChange={(event) => {
                  setAge(event.target.checked);
                  if (event.target.checked) sessionStorage.setItem(AGE_KEY, "yes");
                  else sessionStorage.removeItem(AGE_KEY);
                }}
              />
              <span>I am 21 or older.</span>
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Admin token
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                autoComplete="current-password"
                className={fieldClass}
              />
            </label>
            <button
              type="submit"
              disabled={!age || token.trim().length === 0 || busy}
              className="mt-4 rounded-full bg-[#0f4d3a] px-5 py-3 text-sm font-semibold text-[#f7f4ec] disabled:opacity-60"
            >
              {workspace.status === "opening" ? "Checking…" : "Open the beta"}
            </button>
            {workspace.status === "denied" && (
              <p role="alert" className="mt-4 text-sm text-[#7a2e24]">{workspace.message}</p>
            )}
          </form>
        )}

        {open && (
          <Workspace
            workspace={workspace}
            age={age}
            setAge={setAge}
            paste={paste}
            setPaste={setPaste}
            records={records}
            focused={focused}
            selected={selected}
            comparison={comparison}
            busy={busy}
            actionError={actionError}
            fileRef={fileRef}
            onDismiss={() => send({ type: "dismiss" })}
            onPaste={() => void readText(paste, "Pasted text")}
            onFile={(file) => void readFile(file)}
            onSample={loadSample}
            onToggle={toggleSelected}
            onFocus={setFocusedId}
            onRemove={(record) => void removeRecord(record)}
            onExport={(kind) => {
              if (!comparison) return;
              if (kind === "csv") download("coa-comparison.csv", comparisonToCsv(comparison), "text/csv;charset=utf-8");
              else download("coa-comparison.json", comparisonToJson(comparison, chosen), "application/json");
            }}
          />
        )}
      </div>
    </SiteLayout>
  );
}

function Workspace(props: {
  workspace: Extract<CoaWorkspaceState, { status: "idle" | "parsing" | "error" }>;
  age: boolean;
  setAge: (value: boolean) => void;
  paste: string;
  setPaste: (value: string) => void;
  records: CoaLibraryRecord[];
  focused: CoaLibraryRecord | null;
  selected: string[];
  comparison: Comparison | null;
  busy: boolean;
  actionError: string | null;
  fileRef: RefObject<HTMLInputElement>;
  onDismiss: () => void;
  onPaste: () => void;
  onFile: (file: File) => void;
  onSample: (id: string) => void;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
  onRemove: (record: CoaLibraryRecord) => void;
  onExport: (kind: "csv" | "json") => void;
}) {
  const { workspace } = props;
  return (
    <div className="mt-8 space-y-8">
      {workspace.notice && (
        <p className="rounded-xl border border-[#ddd4c4] bg-[#efeae0] px-4 py-3 text-sm leading-relaxed text-[#24312c]">
          {workspace.notice}
        </p>
      )}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={props.age}
          onChange={(event) => {
            props.setAge(event.target.checked);
            if (event.target.checked) sessionStorage.setItem(AGE_KEY, "yes");
            else sessionStorage.removeItem(AGE_KEY);
          }}
        />
        <span>I am 21 or older. Required before a certificate is read.</span>
      </label>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#ddd4c4] bg-[#f7f4ec] p-5 md:p-6">
          <h2 className="font-heading text-2xl">Add a certificate</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#24312c]">
            The PDF is sent to the server, which reads its text layer and does not keep the file. A scan without selectable text will not work.
          </p>
          <label className="mt-5 block text-sm font-semibold">
            PDF
            <input
              ref={props.fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="mt-2 block w-full text-sm"
              data-coa-upload="pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) props.onFile(file);
              }}
            />
          </label>
          <label className="mt-5 block text-sm font-semibold" htmlFor="coa-paste">
            Or paste certificate text
          </label>
          <textarea
            id="coa-paste"
            value={props.paste}
            onChange={(event) => props.setPaste(event.target.value)}
            rows={8}
            className={fieldClass}
            placeholder="Paste the text from a certificate…"
          />
          <button
            type="button"
            disabled={!props.age || props.busy || props.paste.trim().length === 0}
            onClick={props.onPaste}
            className="mt-4 rounded-full bg-[#0f4d3a] px-5 py-3 text-sm font-semibold text-[#f7f4ec] disabled:opacity-60"
          >
            {workspace.status === "parsing" ? "Reading…" : "Read pasted text"}
          </button>
          {workspace.status === "parsing" && <p role="status" className="mt-3 text-sm text-[#24312c]">Reading the certificate…</p>}
          {workspace.status === "error" && (
            <p role="alert" className="mt-3 text-sm text-[#7a2e24]">
              {workspace.message}{" "}
              <button type="button" className="underline" onClick={props.onDismiss}>Dismiss</button>
            </p>
          )}
          {props.actionError && workspace.status !== "error" && (
            <p role="status" className="mt-3 text-sm text-[#24312c]">{props.actionError}</p>
          )}
        </section>

        <section className="rounded-2xl border border-[#ddd4c4] bg-white p-5 md:p-6">
          <h2 className="font-heading text-2xl">Sample data</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#24312c]">
            Three invented certificates from a fictional lab, Northglass Sample Lab. They are not real results.
          </p>
          <ul className="mt-4 space-y-3">
            {COA_SAMPLES.map((sample) => (
              <li key={sample.id} className="rounded-xl border border-[#eee6d8] p-3">
                <p className="font-semibold">{sample.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#24312c]">{sample.blurb}</p>
                <button
                  type="button"
                  disabled={!props.age || props.busy}
                  onClick={() => props.onSample(sample.id)}
                  className="mt-3 rounded-full border border-[#0f4d3a] px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  Load {sample.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="font-heading text-2xl">Library</h2>
        <p className="mt-2 text-sm text-[#24312c]">Select 2 to 4 certificates to compare. Shaded comparison rows are not the same.</p>
        {props.records.length === 0 && <p className="mt-4 text-[#24312c]">No certificates in this tab yet.</p>}
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {props.records.map((record) => (
            <li key={record.id} className="rounded-xl border border-[#ddd4c4] bg-[#f7f4ec] p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={props.selected.includes(record.id)}
                  aria-label={`Compare ${coaRecordLabel(record.parsed)}`}
                  onChange={() => props.onToggle(record.id)}
                />
                <div className="min-w-0 flex-1">
                  <button type="button" className="text-left font-heading text-xl" onClick={() => props.onFocus(record.id)}>
                    {coaRecordLabel(record.parsed)}
                  </button>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#3d4a44]">
                    {record.parsed.sampleData ? "Sample data · " : ""}
                    {record.serverId ? "Parsed fields saved" : "This tab only"}
                    {" · "}Reader confidence {record.parsed.confidence}/100
                  </p>
                </div>
                <button type="button" className="text-sm underline" onClick={() => props.onRemove(record)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {props.focused && <Detail parsed={props.focused.parsed} />}

      <section data-coa-compare="true">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl">Comparison</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#24312c]">
              Total THC is checked as THC + 0.877 × THCA. Terpene rows convert 1% to 10 mg/g before deciding whether they differ. A shaded row is a difference in the text, not a claim about effects.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!props.comparison} onClick={() => props.onExport("csv")} className="rounded-full border border-[#0f4d3a] px-4 py-2 text-sm font-semibold disabled:opacity-60">Export CSV</button>
            <button type="button" disabled={!props.comparison} onClick={() => props.onExport("json")} className="rounded-full border border-[#0f4d3a] px-4 py-2 text-sm font-semibold disabled:opacity-60">Export JSON</button>
          </div>
        </div>
        {props.selected.length < 2 && (
          <p className="mt-4 text-sm text-[#24312c]">
            {props.selected.length === 0 ? "Select at least two certificates." : "Select one more certificate."}
          </p>
        )}
        {props.comparison && <CompareTable comparison={props.comparison} />}
      </section>
    </div>
  );
}

function Detail({ parsed }: { parsed: ParsedCoa }) {
  return (
    <section className="rounded-2xl border border-[#ddd4c4] bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker text-[#6f2e24]">{parsed.sampleData ? "Sample data" : "Parsed certificate"}</p>
          <h2 className="mt-2 font-heading text-3xl">{coaRecordLabel(parsed)}</h2>
        </div>
        <p className="rounded-full border border-[#cfc6b6] px-3 py-1 text-sm">
          Reader confidence {parsed.confidence}/100
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#24312c]">
        Reader confidence scores how many fields were recognized. It is not a grade of the product.
      </p>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {([
          ["Lab", parsed.labName],
          ["Strain", parsed.strainName],
          ["Batch", parsed.batchId],
          ["Lot", parsed.lotId],
          ["Test date", parsed.testDate],
          ["Source", parsed.sourceName],
        ] as const).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wide text-[#3d4a44]">{label}</dt>
            <dd className="mt-1 font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-6 font-heading text-xl">Cannabinoids</h3>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
        {CANNABINOID_KEYS.map((key) => (
          <li key={key} className="rounded-lg border border-[#eee6d8] px-3 py-2">
            <span className="block text-xs uppercase tracking-wide text-[#3d4a44]">{CANNABINOID_LABELS[key]}</span>
            <span className="font-mono">{formatMeasure(parsed.cannabinoids[key])}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-[#24312c]">
        Computed total THC: {parsed.totals.thc.computed == null ? "—" : `${parsed.totals.thc.computed}${parsed.totals.thc.unit && parsed.totals.thc.unit !== "unknown" ? ` ${parsed.totals.thc.unit}` : ""}`}
        {" · "}
        Computed total CBD: {parsed.totals.cbd.computed == null ? "—" : `${parsed.totals.cbd.computed}${parsed.totals.cbd.unit && parsed.totals.cbd.unit !== "unknown" ? ` ${parsed.totals.cbd.unit}` : ""}`}
      </p>
      <h3 className="mt-6 font-heading text-xl">Terpenes</h3>
      {parsed.terpenes.length === 0 ? <p className="mt-2 text-sm">None recognized.</p> : (
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {parsed.terpenes.map((terpene) => (
            <li key={terpene.name} className="flex items-center justify-between rounded-lg border border-[#eee6d8] px-3 py-2">
              <span>{terpene.name}</span>
              <span className="font-mono">{formatMeasure(terpene.measure)}</span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="mt-6 font-heading text-xl">Safety panels</h3>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
        {SAFETY_PANELS.map((panel) => {
          const status = parsed.safety[panel];
          return (
            <li key={panel} className="rounded-lg border border-[#eee6d8] px-3 py-2">
              <span className="block text-xs uppercase tracking-wide text-[#3d4a44]">{SAFETY_LABELS[panel]}</span>
              <span className={status === "fail" ? "font-semibold text-[#7a2e24]" : ""}>{formatSafety(status)}</span>
            </li>
          );
        })}
      </ul>
      <h3 className="mt-6 font-heading text-xl">Checks and warnings</h3>
      {parsed.flags.length === 0 && parsed.warnings.length === 0 && (
        <p className="mt-2 text-sm">No checks were flagged, and no fields were missing from the read.</p>
      )}
      <ul className="mt-3 space-y-2 text-sm">
        {parsed.flags.map((flag) => (
          <li key={`${flag.code}-${flag.message}`} className="rounded-lg bg-[#f6e7b2] px-3 py-2">{flag.message}</li>
        ))}
        {parsed.warnings.map((warning) => (
          <li key={`${warning.code}-${warning.message}`} className="rounded-lg bg-[#efeae0] px-3 py-2">{warning.message}</li>
        ))}
      </ul>
    </section>
  );
}

const GROUP_LABELS: Record<Comparison["rows"][number]["group"], string> = {
  identity: "Identity",
  cannabinoid: "Cannabinoids",
  terpene: "Terpenes",
  safety: "Safety panels",
};

function CompareTable({ comparison }: { comparison: Comparison }) {
  let previous = "";
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-[#ddd4c4]">
      {comparison.flags.length > 0 && (
        <ul className="space-y-2 border-b border-[#ddd4c4] bg-[#f7f4ec] px-4 py-4 text-sm">
          {comparison.flags.map((flag) => (
            <li key={`${flag.id}-${flag.code}-${flag.message}`}>
              <span className="font-semibold">{flag.label}.</span> {flag.message}
            </li>
          ))}
        </ul>
      )}
      <table className="min-w-full border-collapse text-left text-sm">
        <caption className="sr-only">Side-by-side certificate comparison. Shaded cells are rows that differ.</caption>
        <thead className="bg-[#efeae0] text-xs uppercase tracking-wide text-[#3d4a44]">
          <tr>
            <th scope="col" className="px-3 py-3 font-medium">Field</th>
            {comparison.columns.map((column) => (
              <th key={column.id} scope="col" className="px-3 py-3 font-medium">
                {column.label}
                {column.sampleData ? " (sample)" : ""}
                <span className="mt-1 block normal-case tracking-normal">Confidence {column.confidence}/100</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => {
            const header = row.group !== previous;
            previous = row.group;
            return (
              <Fragment key={`${row.group}-${row.label}`}>
                {header && (
                  <tr className="bg-[#f7f4ec]">
                    <th colSpan={comparison.columns.length + 1} scope="colgroup" className="px-3 py-2 text-xs uppercase tracking-wide text-[#3d4a44]">
                      {GROUP_LABELS[row.group]}
                    </th>
                  </tr>
                )}
                <tr className="border-t border-[#eee6d8]">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 font-medium">{row.label}</th>
                  {row.cells.map((cell, index) => (
                    <td
                      key={`${row.label}-${comparison.columns[index]?.id ?? index}`}
                      className={`px-3 py-2 font-mono ${cell.different ? "bg-[#f6e7b2]" : ""} ${cell.text === "Fail" ? "font-semibold text-[#7a2e24]" : ""}`}
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
