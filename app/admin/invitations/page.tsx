"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
	CheckCircle2,
	Circle,
	Clock,
	Mail,
	MailX,
	RefreshCw,
	UserPlus,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/app/providers/trpc-provider";
import { EmailPreviewModal } from "@/components/admin/EmailPreviewModal";
import { useSession } from "@/lib/auth-client";
import { formatDistanceToNow } from "date-fns";

const invitationFormSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	role: z.enum(["admin", "accountant", "member"]),
	customMessage: z.string().optional(),
});

type InvitationFormValues = z.infer<typeof invitationFormSchema>;

export default function InvitationsPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const utils = trpc.useUtils();
	const { data: session } = useSession();

	const { data: invitations, isLoading } = trpc.invitations.list.useQuery();
	const { data: rateLimitStatus } =
		trpc.invitations.getRateLimitStatus.useQuery();
	const { data: activityLogs } = trpc.invitations.getActivityLogs.useQuery({
		limit: 10,
	});

	const sendInvitationMutation = trpc.invitations.send.useMutation({
		onSuccess: () => {
			toast.success("Invitation sent successfully");
			utils.invitations.list.invalidate();
			setIsDialogOpen(false);
			form.reset();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const resendInvitationMutation = trpc.invitations.resend.useMutation({
		onSuccess: () => {
			toast.success("Invitation resent successfully");
			utils.invitations.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const cancelInvitationMutation = trpc.invitations.cancel.useMutation({
		onSuccess: () => {
			toast.success("Invitation cancelled");
			utils.invitations.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const form = useForm<InvitationFormValues>({
		resolver: zodResolver(invitationFormSchema),
		defaultValues: {
			email: "",
			role: "member",
			customMessage: "",
		},
	});

	const watchedEmail = form.watch("email");
	const watchedCustomMessage = form.watch("customMessage");

	const onSubmit = (data: InvitationFormValues) => {
		sendInvitationMutation.mutate(data);
	};

	const getStatusBadge = (
		status: string,
		expiresAt: Date,
	): React.ReactNode => {
		const isExpired = new Date() > new Date(expiresAt);

		if (status === "accepted") {
			return (
				<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Accepted
				</Badge>
			);
		}

		if (status === "cancelled") {
			return (
				<Badge variant="destructive">
					<XCircle className="mr-1 h-3 w-3" />
					Cancelled
				</Badge>
			);
		}

		if (status === "expired" || isExpired) {
			return (
				<Badge variant="secondary">
					<Clock className="mr-1 h-3 w-3" />
					Expired
				</Badge>
			);
		}

		return (
			<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
				<Mail className="mr-1 h-3 w-3" />
				Pending
			</Badge>
		);
	};

	const getRoleBadge = (role: string): React.ReactNode => {
		const roleColors = {
			admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
			accountant:
				"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
			member:
				"bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
		};

		const roleLabels = {
			admin: "Admin",
			accountant: "Accountant",
			member: "Member",
		};

		return (
			<Badge className={roleColors[role as keyof typeof roleColors]}>
				{roleLabels[role as keyof typeof roleLabels] || role}
			</Badge>
		);
	};

	const pendingInvitations =
		invitations?.filter(
			(inv) =>
				inv.status === "pending" && new Date() <= new Date(inv.expiresAt),
		) || [];
	const acceptedInvitations =
		invitations?.filter((inv) => inv.status === "accepted") || [];
	const expiredInvitations =
		invitations?.filter(
			(inv) =>
				inv.status === "expired" ||
				inv.status === "cancelled" ||
				new Date() > new Date(inv.expiresAt),
		) || [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						User Invitations
					</h1>
					<p className="text-muted-foreground">
						Invite new users to join your organization
					</p>
					{rateLimitStatus && (
						<div className="mt-2 flex gap-4 text-xs text-muted-foreground">
							<span>
								Hourly: {rateLimitStatus.hourly.remaining}/
								{rateLimitStatus.hourly.limit} remaining
							</span>
							<span>•</span>
							<span>
								Daily: {rateLimitStatus.daily.remaining}/
								{rateLimitStatus.daily.limit} remaining
							</span>
						</div>
					)}
				</div>

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<UserPlus className="mr-2 h-4 w-4" />
							Invite User
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Invite New User</DialogTitle>
							<DialogDescription>
								Send an invitation to a new user. They will receive an email
								with a link to set up their account.
							</DialogDescription>
						</DialogHeader>

						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Address</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="user@example.com"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												The email address where the invitation will be sent
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="role"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Role</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a role" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="member">Member</SelectItem>
													<SelectItem value="accountant">
														Accountant
													</SelectItem>
													<SelectItem value="admin">Admin</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												The role the user will have in your organization
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="customMessage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Custom Message (Optional)</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Add a personal welcome message..."
													className="resize-none"
													rows={3}
													{...field}
												/>
											</FormControl>
											<FormDescription>
												A personalized message that will be included in the
												invitation email
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex justify-end">
									<EmailPreviewModal
										previewData={{
											email: watchedEmail || "user@example.com",
											invitedByName: session?.user?.name || "Your Administrator",
											organizationName: "Practice Hub",
											customMessage: watchedCustomMessage,
										}}
									/>
								</div>

								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={sendInvitationMutation.isPending}
									>
										{sendInvitationMutation.isPending
											? "Sending..."
											: "Send Invitation"}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Invitations
						</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{pendingInvitations.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Accepted</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{acceptedInvitations.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Expired/Cancelled
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{expiredInvitations.length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Invitations Tabs */}
			<Tabs defaultValue="active" className="space-y-4">
				<TabsList>
					<TabsTrigger value="active">
						Active ({pendingInvitations.length})
					</TabsTrigger>
					<TabsTrigger value="accepted">
						Accepted ({acceptedInvitations.length})
					</TabsTrigger>
					<TabsTrigger value="expired">
						Cancelled/Expired ({expiredInvitations.length})
					</TabsTrigger>
				</TabsList>

				{/* Active Tab */}
				<TabsContent value="active">
					{isLoading ? (
						<div className="flex items-center justify-center py-8 glass-card">
							<div className="text-muted-foreground">Loading invitations...</div>
						</div>
					) : pendingInvitations.length > 0 ? (
						<div className="glass-table">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Invited By</TableHead>
										<TableHead>Sent</TableHead>
										<TableHead>Expires</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pendingInvitations.map((invitation) => (
										<TableRow key={invitation.id}>
											<TableCell className="font-medium">
												{invitation.email}
											</TableCell>
											<TableCell>{getRoleBadge(invitation.role)}</TableCell>
											<TableCell>
												{getStatusBadge(invitation.status, invitation.expiresAt)}
											</TableCell>
											<TableCell>
												{invitation.invitedBy?.name ||
													invitation.invitedBy?.email ||
													"Unknown"}
											</TableCell>
											<TableCell>
												{format(new Date(invitation.createdAt), "MMM d, yyyy")}
											</TableCell>
											<TableCell>
												{format(new Date(invitation.expiresAt), "MMM d, yyyy")}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															resendInvitationMutation.mutate({
																invitationId: invitation.id,
															})
														}
														disabled={resendInvitationMutation.isPending}
														title="Resend invitation"
													>
														<RefreshCw className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															cancelInvitationMutation.mutate({
																invitationId: invitation.id,
															})
														}
														disabled={cancelInvitationMutation.isPending}
														title="Cancel invitation"
													>
														<MailX className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 text-center glass-card">
							<Mail className="mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 text-lg font-semibold">
								No active invitations
							</h3>
							<p className="mb-4 text-muted-foreground">
								All invitations have been accepted or expired
							</p>
						</div>
					)}
				</TabsContent>

				{/* Accepted Tab */}
				<TabsContent value="accepted">
					{isLoading ? (
						<div className="flex items-center justify-center py-8 glass-card">
							<div className="text-muted-foreground">Loading invitations...</div>
						</div>
					) : acceptedInvitations.length > 0 ? (
						<div className="glass-table">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Invited By</TableHead>
										<TableHead>Sent</TableHead>
										<TableHead>Accepted</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{acceptedInvitations.map((invitation) => (
										<TableRow key={invitation.id}>
											<TableCell className="font-medium">
												{invitation.email}
											</TableCell>
											<TableCell>{getRoleBadge(invitation.role)}</TableCell>
											<TableCell>
												{getStatusBadge(invitation.status, invitation.expiresAt)}
											</TableCell>
											<TableCell>
												{invitation.invitedBy?.name ||
													invitation.invitedBy?.email ||
													"Unknown"}
											</TableCell>
											<TableCell>
												{format(new Date(invitation.createdAt), "MMM d, yyyy")}
											</TableCell>
											<TableCell>
												{invitation.acceptedAt
													? format(new Date(invitation.acceptedAt), "MMM d, yyyy")
													: "—"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 text-center glass-card">
							<CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 text-lg font-semibold">
								No accepted invitations
							</h3>
							<p className="mb-4 text-muted-foreground">
								Users who accept invitations will appear here
							</p>
						</div>
					)}
				</TabsContent>

				{/* Expired/Cancelled Tab */}
				<TabsContent value="expired">
					{isLoading ? (
						<div className="flex items-center justify-center py-8 glass-card">
							<div className="text-muted-foreground">Loading invitations...</div>
						</div>
					) : expiredInvitations.length > 0 ? (
						<div className="glass-table">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Invited By</TableHead>
										<TableHead>Sent</TableHead>
										<TableHead>Expired</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{expiredInvitations.map((invitation) => (
										<TableRow key={invitation.id}>
											<TableCell className="font-medium">
												{invitation.email}
											</TableCell>
											<TableCell>{getRoleBadge(invitation.role)}</TableCell>
											<TableCell>
												{getStatusBadge(invitation.status, invitation.expiresAt)}
											</TableCell>
											<TableCell>
												{invitation.invitedBy?.name ||
													invitation.invitedBy?.email ||
													"Unknown"}
											</TableCell>
											<TableCell>
												{format(new Date(invitation.createdAt), "MMM d, yyyy")}
											</TableCell>
											<TableCell>
												{format(new Date(invitation.expiresAt), "MMM d, yyyy")}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 text-center glass-card">
							<Clock className="mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 text-lg font-semibold">
								No expired or cancelled invitations
							</h3>
							<p className="mb-4 text-muted-foreground">
								Expired and cancelled invitations will appear here
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Recent Activity */}
			{activityLogs && activityLogs.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{activityLogs.map((log) => {
								const getIcon = (action: string) => {
									switch (action) {
										case "invitation.sent":
											return <Mail className="h-4 w-4 text-blue-600" />;
										case "invitation.resent":
											return <RefreshCw className="h-4 w-4 text-yellow-600" />;
										case "invitation.accepted":
											return <CheckCircle2 className="h-4 w-4 text-green-600" />;
										case "invitation.cancelled":
											return <XCircle className="h-4 w-4 text-red-600" />;
										case "invitation.expired":
											return <Clock className="h-4 w-4 text-gray-600" />;
										default:
											return <Circle className="h-4 w-4 text-gray-600" />;
									}
								};

								return (
									<div
										key={log.id}
										className="flex items-start gap-3 rounded-lg border p-3 text-sm"
									>
										<div className="mt-0.5">{getIcon(log.action)}</div>
										<div className="flex-1">
											<p className="font-medium">{log.description}</p>
											<p className="text-xs text-muted-foreground">
												{log.userName} •{" "}
												{formatDistanceToNow(new Date(log.createdAt), {
													addSuffix: true,
												})}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
