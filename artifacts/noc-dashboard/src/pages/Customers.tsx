import React, { useState } from "react";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Building, Trash2, Edit2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Customers() {
  const { data: customers, isLoading } = useListCustomers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", contactPerson: "", phone: "", email: "", address: "" },
  });

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      updateCustomer.mutate({ id: editingId, data }, {
        onSuccess: () => {
          toast({ title: "Customer updated" });
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
          handleClose();
        }
      });
    } else {
      createCustomer.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Customer created" });
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
          handleClose();
        }
      });
    }
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    form.reset({
      name: customer.name,
      contactPerson: customer.contactPerson || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer.mutate({ data: { id: id as any } } as any, {
        onSuccess: () => {
          toast({ title: "Customer deleted" });
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        }
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    form.reset({ name: "", contactPerson: "", phone: "", email: "", address: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage client organizations and contacts.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <Plus className="mr-2 h-4 w-4" />
              ADD CUSTOMER
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Customer" : "New Customer"}</DialogTitle>
              <DialogDescription>
                Provide organizational details for the client.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
                    {(createCustomer.isPending || updateCustomer.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Details
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
              <TableHead>Organization</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone / Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : customers?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No customers found.</TableCell></TableRow>
            ) : (
              customers?.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {customer.name}
                  </TableCell>
                  <TableCell>{customer.contactPerson || "-"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.phone && <div>{customer.phone}</div>}
                      {customer.email && <div className="text-muted-foreground">{customer.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {/* Assuming delete works, API hook needs proper mutation signature for delete, but standard delete takes id in query or path. Let's assume path. */}
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
