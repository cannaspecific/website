import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInterestSchema, type InsertInterest } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle2 } from "lucide-react";

const interestOptions = [
  { value: "contribute", label: "Contribute as a User", description: "Share your cannabis experiences" },
  { value: "partnership", label: "Explore Partnership", description: "Dispensaries & businesses" },
  { value: "research", label: "Research Collaboration", description: "Academic & scientific research" },
  { value: "donation", label: "Make a Donation", description: "Support our mission financially" },
  { value: "general", label: "General Inquiry", description: "Questions or other interests" },
];

export default function InterestFormSection() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertInterest>({
    resolver: zodResolver(insertInterestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      interestType: "contribute",
      message: "",
      subscribeToUpdates: false,
    },
  });

  const submitInterest = useMutation({
    mutationFn: async (data: InsertInterest) => {
      return await apiRequest("POST", "/api/interests", data);
    },
    onSuccess: (response) => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Thank You!",
        description: response.message || "We've received your interest and will be in touch soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInterest) => {
    submitInterest.mutate(data);
  };

  if (isSubmitted) {
    return (
      <section id="interest-form" className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-card">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 md:p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" data-testid="icon-success" />
            <h3 
              className="text-2xl font-bold mb-4" 
              style={{ fontFamily: 'var(--font-heading)' }}
              data-testid="text-success-headline"
            >
              Thank You for Joining Us!
            </h3>
            <p className="text-lg text-muted-foreground mb-6" data-testid="text-success-message">
              We've received your interest and will be in touch soon. Together, we're building a better future for cannabis.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              data-testid="button-submit-another"
            >
              Submit Another Response
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="interest-form" className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-card">
      <div className="max-w-2xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-form-headline"
        >
          Join the Movement
        </h2>
        
        <p className="text-lg text-center text-muted-foreground mb-12" data-testid="text-form-intro">
          Take the first step towards a more transparent cannabis future
        </p>
        
        <Card className="p-8 md:p-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        data-testid="input-full-name"
                        disabled={submitInterest.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="john@example.com" 
                        {...field} 
                        data-testid="input-email"
                        disabled={submitInterest.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="(555) 123-4567" 
                        {...field} 
                        data-testid="input-phone"
                        disabled={submitInterest.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="interestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I'm Interested In *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                        disabled={submitInterest.isPending}
                      >
                        {interestOptions.map((option) => (
                          <div key={option.value} className="flex items-start space-x-3">
                            <RadioGroupItem 
                              value={option.value} 
                              id={option.value}
                              data-testid={`radio-${option.value}`}
                              disabled={submitInterest.isPending}
                            />
                            <Label 
                              htmlFor={option.value}
                              className="cursor-pointer flex-1"
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">{option.description}</div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tell Us More *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your thoughts, questions, or how you'd like to contribute..."
                        className="min-h-32"
                        {...field} 
                        data-testid="textarea-message"
                        disabled={submitInterest.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subscribeToUpdates"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-subscribe"
                        disabled={submitInterest.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Subscribe to CannaSpecific updates
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Get the latest news about our progress and cannabis research insights
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitInterest.isPending}
                data-testid="button-submit-form"
              >
                {submitInterest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Your Interest"
                )}
              </Button>
              
              <p className="text-sm text-center text-muted-foreground" data-testid="text-privacy-note">
                Your information is secure and will only be used to contact you about CannaSpecific. We respect your privacy.
              </p>
            </form>
          </Form>
        </Card>
      </div>
    </section>
  );
}
