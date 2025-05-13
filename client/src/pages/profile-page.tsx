import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
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
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodType: z.string().optional(),
  height: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  weight: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profileData, isLoading } = useQuery<User>({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", profileData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profileData?.firstName || "",
      lastName: profileData?.lastName || "",
      email: profileData?.email || "",
      phoneNumber: profileData?.phoneNumber || "",
      dateOfBirth: profileData?.dateOfBirth || "",
      bloodType: profileData?.bloodType || "",
      height: profileData?.height?.toString() || "",
      weight: profileData?.weight?.toString() || "",
      allergies: profileData?.allergies || "",
      chronicConditions: profileData?.chronicConditions || "",
    },
  });

  // Update form values when profile data is loaded
  useState(() => {
    if (profileData) {
      form.reset({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber || "",
        dateOfBirth: profileData.dateOfBirth || "",
        bloodType: profileData.bloodType || "",
        height: profileData.height?.toString() || "",
        weight: profileData.weight?.toString() || "",
        allergies: profileData.allergies || "",
        chronicConditions: profileData.chronicConditions || "",
      });
    }
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <MobileLayout>
      <div className="bg-primary py-6 px-4 text-white">
        <h1 className="text-xl font-semibold">My Profile</h1>
      </div>
      
      <div className="px-4 py-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-muted-foreground font-bold text-2xl">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow">
              <Camera className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Personal Information</h2>
                  {!isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">First Name</FormLabel>
                          <FormControl>
                            <Input 
                              disabled={!isEditing}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">Last Name</FormLabel>
                          <FormControl>
                            <Input 
                              disabled={!isEditing}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            disabled={!isEditing}
                            {...field} 
                          />
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
                        <FormLabel className="text-sm text-muted-foreground">Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            disabled={!isEditing}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">Date of Birth</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            disabled={!isEditing}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4">Medical Information</h2>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">Blood Type</FormLabel>
                        <Select
                          disabled={!isEditing}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bloodTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">Height (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              disabled={!isEditing}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              disabled={!isEditing}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">Allergies</FormLabel>
                        <FormControl>
                          <Textarea 
                            disabled={!isEditing}
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="chronicConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">Chronic Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            disabled={!isEditing}
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {isEditing && (
              <Button 
                type="submit" 
                className="w-full mb-3"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving Changes..." : "Save Changes"}
              </Button>
            )}
            
            {isEditing && (
              <Button 
                type="button"
                variant="outline" 
                className="w-full mb-3"
                onClick={() => {
                  setIsEditing(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
            )}
          </form>
        </Form>
        
        <Button 
          variant="outline" 
          className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Logging out..." : "Log Out"}
        </Button>
      </div>
    </MobileLayout>
  );
}

function ProfileSkeleton() {
  return (
    <MobileLayout>
      <div className="bg-primary py-6 px-4 text-white">
        <Skeleton className="h-6 w-32 bg-blue-400" />
      </div>
      
      <div className="px-4 py-6">
        <div className="flex items-center justify-center mb-6">
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-12" />
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-40 mb-4" />
            
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-20 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </MobileLayout>
  );
}
