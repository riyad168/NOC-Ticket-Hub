import React from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateTicket, 
  useListCustomers, 
  useListCategories,
  useListUsers,
  useListDepartments
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  customerId: z.coerce.number().min(1, { message: "Customer is required" }),
  categoryId: z.coerce.number().min(1, { message: "Category is required" }),
  departmentId: z.coerce.number().optional().nullable(),
  assignedTo: z.coerce.number().optional().nullable(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TicketNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: customers, isLoading: loadingCustomers } = useListCustomers();
  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: users, isLoading: loadingUsers } = useListUsers();
  const { data: departments, isLoading: loadingDepartments } = useListDepartments();

  const createTicket = useCreateTicket();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: 0,
      categoryId: 0,
      departmentId: null,
      assignedTo: null,
      remarks: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createTicket.mutate({ data }, {
      onSuccess: (ticket) => {
        toast({ title: "Ticket created successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setLocation(`/tickets/${ticket.id}`);
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to create ticket" });
      }
    });
  };

  const isLoading = loadingCustomers || loadingCategories || loadingUsers || loadingDepartments;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/tickets" className="hover:text-foreground flex items-center transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tickets
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Incident Ticket</h1>
        <p className="text-muted-foreground">Log a new network issue or request.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>All fields marked with an asterisk are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={String(customer.id)}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Category *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : "unassigned"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="No Department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">No Department</SelectItem>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Engineer</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : "unassigned"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                          {users?.filter(u => u.role === 'noc_engineer' || u.role === 'admin').map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks / Issue Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide detailed information about the incident..." 
                        className="bg-background min-h-[150px] font-mono text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Link href="/tickets">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={createTicket.isPending} className="font-bold">
                  {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  INITIALIZE TICKET
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
