import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Camera, Phone, User, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Expert } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MobileLayout from "@/components/layouts/mobile-layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const expertProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  about: z.string().min(1, "About section is required"),
  education: z.string().min(1, "Education is required"),
  experience: z.string().min(1, "Experience is required"),
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
});

type ExpertProfileFormValues = z.infer<typeof expertProfileSchema>;

export default function ExpertSettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: expertProfile, isLoading } = useQuery<Expert>({
    queryKey: ["/api/expert-profile"],
  });

  const updateExpertProfileMutation = useMutation({
    mutationFn: async (profileData: ExpertProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/expert-profile", profileData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expert-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expert-profile/detailed"] });
      toast({
        title: "Profile updated",
        description: "Your expert profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ExpertProfileFormValues>({
    resolver: zodResolver(expertProfileSchema),
    defaultValues: {
      name: "",
      specialty: "",
      about: "",
      education: "",
      experience: "",
      phoneNumber: "",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (expertProfile) {
      form.reset({
        name: expertProfile.name,
        specialty: expertProfile.specialty,
        about: expertProfile.about,
        education: expertProfile.education,
        experience: expertProfile.experience,
        phoneNumber: expertProfile.phoneNumber || "",
      });
    }
  }, [expertProfile, form]);

  const onSubmit = (data: ExpertProfileFormValues) => {
    updateExpertProfileMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return <ExpertSettingsSkeleton />;
  }

  return (
    <MobileLayout>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-4 text-white">
        <h1 className="text-xl font-semibold">Expert Settings</h1>
      </div>
      
      <div className="px-4 py-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl border-4 border-white shadow-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-blue-100">
              <Camera className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="mb-6 border-0 shadow-modern-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <User className="h-5 w-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <FormControl>
                        <Input placeholder="Clinical Psychologist" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description about yourself..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="mb-6 border-0 shadow-modern-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Building2 className="h-5 w-5" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Your educational background..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Your professional experience..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg"
                disabled={updateExpertProfileMutation.isPending}
              >
                {updateExpertProfileMutation.isPending ? "Updating..." : "Update Profile"}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MobileLayout>
  );
}

function ExpertSettingsSkeleton() {
  return (
    <MobileLayout>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-4 text-white">
        <h1 className="text-xl font-semibold">Expert Settings</h1>
      </div>
      
      <div className="px-4 py-6">
        <div className="flex items-center justify-center mb-6">
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </MobileLayout>
  );
}