"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InvitationEmailPreviewParams } from "@/lib/email/preview";
import { generateInvitationEmailPreview } from "@/lib/email/preview";

interface EmailPreviewModalProps {
	previewData: InvitationEmailPreviewParams;
	triggerButton?: React.ReactNode;
}

export function EmailPreviewModal({
	previewData,
	triggerButton,
}: EmailPreviewModalProps) {
	const [htmlContent, setHtmlContent] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsLoading(true);
			generateInvitationEmailPreview(previewData)
				.then(setHtmlContent)
				.finally(() => setIsLoading(false));
		}
	}, [isOpen, previewData]);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{triggerButton || (
					<Button variant="outline" type="button">
						<Eye className="mr-2 h-4 w-4" />
						Preview Email
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle>Email Preview</DialogTitle>
					<DialogDescription>
						This is how the invitation email will appear to{" "}
						<span className="font-semibold">{previewData.email}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto border rounded-lg bg-slate-50 dark:bg-slate-900">
					{isLoading ? (
						<div className="flex items-center justify-center p-8">
							<p className="text-muted-foreground">Loading preview...</p>
						</div>
					) : (
						<div className="p-4">
							<div
								className="bg-white dark:bg-slate-800 rounded-lg shadow-sm"
								style={{ maxWidth: "600px", margin: "0 auto" }}
							>
								<iframe
									srcDoc={htmlContent}
									title="Email Preview"
									className="w-full h-[600px] border-0"
									sandbox="allow-same-origin"
								/>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
