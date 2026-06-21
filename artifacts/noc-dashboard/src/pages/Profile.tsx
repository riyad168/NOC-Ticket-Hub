import React from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account information.</p>
      </div>
      
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b">
            <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium col-span-1">Full Name</span>
              <span className="col-span-2 text-foreground">{user.name}</span>
            </div>
            <div className="grid grid-cols-3 py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium col-span-1">Email Address</span>
              <span className="col-span-2 text-foreground">{user.email}</span>
            </div>
            <div className="grid grid-cols-3 py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium col-span-1">Role</span>
              <span className="col-span-2 text-foreground capitalize">{user.role.replace('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-3 py-3">
              <span className="text-muted-foreground font-medium col-span-1">Account Created</span>
              <span className="col-span-2 text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
