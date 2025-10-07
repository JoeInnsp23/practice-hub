"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/app/providers/trpc-provider";
import { signIn } from "@/lib/auth-client";

const acceptInvitationFormSchema = z
	.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type AcceptInvitationFormValues = z.infer<typeof acceptInvitationFormSchema>;

export default function AcceptInvitationPage() {
	const params = useParams();
	const router = useRouter();
	const token = params.token as string;
	const [invitationVerified, setInvitationVerified] = useState(false);
	const [invitationEmail, setInvitationEmail] = useState("");
	const [invitationRole, setInvitationRole] = useState("");

	const {
		data: invitationData,
		isLoading: isVerifying,
		error: verifyError,
	} = trpc.invitations.verify.useQuery(
		{ token },
		{
			enabled: !!token,
			retry: false,
		},
	);

	const acceptInvitationMutation = trpc.invitations.accept.useMutation({
		onSuccess: async (data) => {
			toast.success("Account created successfully!");

			// Sign in the user with their new credentials
			const signInResult = await signIn.email({
				email: data.email,
				password: form.getValues("password"),
			});

			if (signInResult.error) {
				toast.error("Account created but sign-in failed. Please sign in manually.");
				router.push("/sign-in");
				return;
			}

			// Redirect to practice hub
			router.push("/");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const form = useForm<AcceptInvitationFormValues>({
		resolver: zodResolver(acceptInvitationFormSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			password: "",
			confirmPassword: "",
		},
	});

	useEffect(() => {
		if (invitationData) {
			setInvitationVerified(true);
			setInvitationEmail(invitationData.email);
			setInvitationRole(invitationData.role);
		}
	}, [invitationData]);

	const onSubmit = (data: AcceptInvitationFormValues) => {
		acceptInvitationMutation.mutate({
			token,
			firstName: data.firstName,
			lastName: data.lastName,
			password: data.password,
		});
	};

	// Loading state
	if (isVerifying) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground">Verifying invitation...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Error state
	if (verifyError || !invitationVerified) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
				<Card className="w-full max-w-md">
					<CardHeader>
						<div className="flex items-center justify-center">
							<XCircle className="h-12 w-12 text-red-500" />
						</div>
						<CardTitle className="text-center">Invalid Invitation</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							{verifyError?.message ||
								"This invitation link is invalid or has expired."}
						</p>
						<Button onClick={() => router.push("/sign-in")} className="w-full">
							Go to Sign In
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success - show form
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-4">
					<div className="flex items-center justify-center">
						<div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
							<CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
						</div>
					</div>
					<div className="text-center">
						<CardTitle className="text-2xl">Welcome to Practice Hub!</CardTitle>
						<p className="mt-2 text-sm text-muted-foreground">
							You've been invited to join as a{" "}
							<span className="font-semibold">{invitationRole}</span>
						</p>
					</div>
				</CardHeader>
				<CardContent>
					<div className="mb-6 rounded-lg border border-border bg-muted/50 p-4">
						<div className="flex items-center gap-2 text-sm">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium">{invitationEmail}</span>
						</div>
					</div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input placeholder="John" {...field} />
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
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input placeholder="Doe" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								disabled={acceptInvitationMutation.isPending}
							>
								{acceptInvitationMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating Account...
									</>
								) : (
									"Create Account"
								)}
							</Button>
						</form>
					</Form>

					<p className="mt-6 text-center text-xs text-muted-foreground">
						By creating an account, you agree to our Terms of Service and Privacy
						Policy.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
