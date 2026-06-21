import React, { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Shield, User as UserIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "noc_engineer", "manager"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function Users() {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  const { data: users, isLoading } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", role: "noc_engineer" },
  });

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      const updateData = { name: data.name, email: data.email, role: data.role };
      updateUser.mutate({ id: editingId, data: updateData }, {
        onSuccess: () => {
          toast({ title: "User updated" });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
          handleClose();
        }
      });
    } else {
      if (!data.password) {
        form.setError("password", { message: "Password is required for new users" });
        return;
      }
      createUser.mutate({ data: data as any }, {
        onSuccess: () => {
          toast({ title: "User created" });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
          handleClose();
        }
      });
    }
  };

  const handleEdit = (u: any) => {
    setEditingId(u.id);
    form.reset({ name: u.name, email: u.email, role: u.role, password: "" });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    form.reset({ name: "", email: "", password: "", role: "noc_engineer" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
          <p className="text-muted-foreground">Manage access to the NOC Command Center.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <Plus className="mr-2 h-4 w-4" />
              PROVISION USER
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit User Access" : "Provision New User"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Clearance Level (Role)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="noc_engineer">NOC Engineer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
                {!editingId && (
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Initial Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                    {(createUser.isPending || updateUser.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : (
              users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {u.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{u.email}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
                      {u.role === 'admin' && <Shield className="h-3 w-3 text-destructive" />}
                      {u.role.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(u)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
