"use client"
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronsUpDown } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { actions } from "astro:actions";


import { cn } from "/src/layouts/components/lib/utils"
import { Button } from "/src/layouts/components/ui/button"
import { Separator } from "/src/layouts/components/ui/separator"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "/src/layouts/components/ui/command"
import { Input } from "/src/layouts/components/ui/input"
import { Checkbox } from "/src/layouts/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "/src/layouts/components/ui/radio-group"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "/src/layouts/components/ui/form"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "/src/layouts/components/ui/popover"

const FormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),

  userID: z.string().min(1, { message: "IU Username is required." }),
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  phone: z.string().length(10, { message: "Phone number must be exactly 10 digits." }).regex(/^\d{10}$/, { message: "Phone number must contain only digits." }),
  textOK: z.boolean().default(true).optional(),
  
  dept: z.string().min(3, { message: "Please select a department." }),
  otherDept: z.string().optional(),
  subfield: z.string().optional(),
  card: z.boolean().default(true),
  contract: z.enum([
    "saa-instructional",
    "saa-research",
    "saa-assisstant",
    "fellowship",
    "hourly",
    "none",
  ], { message: "Please select a contract type." }),
  location: z.string().optional(),
  year: z.string().min(4, { message: "Too small." }).max(4, { message: "Too big." }).startsWith('20', "A year in this century, we mean."),
  getInvolved: z.boolean().default(false).optional(),
}).superRefine((data, ctx) => {
  if (data.dept === "other" && (!data.otherDept || data.otherDept.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your department.",
      path: ["otherDept"],
    });
  }
});


export function Card({depts}) {
	const [open, setOpen] = React.useState(false)
	const [submissionSuccess, setSubmissionSuccess] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [userFirstName, setUserFirstName] = React.useState('');
	const welcomeRef = React.useRef(null);
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
        textOK: true,
        getInvolved: false,
    },
	})
	
	const selectedDept = useWatch({
		control: form.control,
		name: "dept",
	})

	React.useEffect(() => {
		if (submissionSuccess && welcomeRef.current) {
			const welcome = welcomeRef.current;
			const elementPosition = welcome.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.scrollY;
			const topPadding = 50;
			
			window.scrollTo({
				top: offsetPosition - topPadding,
				behavior: 'smooth'
			});
		}
	}, [submissionSuccess]);

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		try {
			setIsSubmitting(true);
			const result = await actions.unionCard(data); 
			setUserFirstName(data.firstName); 
			setSubmissionSuccess(true); 
		} catch (error) {
			console.error("Failed to submit form:", error);
			alert("Failed to submit the form. Please try again.");
		} finally {
			setIsSubmitting(false); 
		}
	};

	return (
		<Form {...form}>
		{submissionSuccess ? (
			<div ref={welcomeRef} className="red third mt-8">
				<h2>Welcome to the Union{userFirstName ? `, ${userFirstName}` : ''}!</h2>
				<div className="basis-[calc(66%-3rem)] grow">
				<h3>Grad workers are now one card closer to a better IU!</h3>
				<p>Want to do more?</p>
				<ul>
					<li>Come to an <a href="/calendar">Organizing Committee meeting</a></li>
					<li>Sign up for <a href="/dues">Voluntary Dues</a></li>
					<li>Help <a href="/meet-with-me">organize your department</a></li>
				</ul>
				</div>
			</div>
		) : (
			<form onSubmit={form.handleSubmit(onSubmit)} className="text-secondary bg-white bg-[url('/grain.png')] bg-repeat rounded-lg drop-shadow-[2px_0px_4px_white] p-4 max-w-3xl mx-auto my-8 flex flex-wrap justify-between gap-8">
				<div>
					<h3 className="basis-full">IGWC Card</h3>
					<p className="basis-full">I hereby request and accept membership in the Indiana Graduate Workers Coalition (IGWC). I authorize the IGWC to represent me and negotiate on my behalf all wages, benefits, and working conditions for SAA positions as the exclusive bargaining representative of graduate employees at IU.</p>
				<Separator />
				</div>
				<FormField
					control={form.control}
					name="firstName"
					render={({ field }) => (
						<FormItem className="basis-[calc(50%-1rem)] min-w-2xs grow">
							<FormLabel className="font-headline-serif text-2xl">First Name</FormLabel>
							<FormControl>
								<Input autoComplete="given-name" placeholder="First Name" {...field} />
							</FormControl>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="lastName"
					render={({ field }) => (
						<FormItem className="basis-[calc(50%-1rem)] min-w-2xs grow">
							<FormLabel className="font-headline-serif text-2xl">Last Name</FormLabel>
							<FormControl>
								<Input autoComplete="family-name" placeholder="Last Name" {...field} />
							</FormControl>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="userID"
					render={({ field }) => (
						<FormItem className="basis-2/3 min-w-2xs">
							<FormLabel className="font-headline-serif text-2xl">IU Username</FormLabel>
							<FormControl>
								<Input placeholder="IU Username" {...field} />
							</FormControl>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="basis-2/3 min-w-2xs">
							<FormLabel className="font-headline-serif text-2xl">Non-IU Email</FormLabel>
							<FormControl>
								<Input type="email" autoComplete="email" placeholder="Non-IU Email" {...field} />
							</FormControl>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
				<div>
				<FormField
					control={form.control}
					name="phone"
					render={({ field }) => (
						<FormItem className="basis-2/3 min-w-2xs">
							<FormLabel className="font-headline-serif text-2xl">US Phone Number</FormLabel>
							<FormControl>
								<Input type="tel" autoComplete="tel" placeholder="Phone Number" {...field} />
							</FormControl>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>

					<FormField
						control={form.control}
						name="textOK"
						render={({ field }) => (
							<FormItem className="basis-2/3 min-w-2xs flex mt-4 px-1 items-center">
								<FormControl>
									<Checkbox
										className="cursor-pointer"
										tabIndex={0}
										checked={field.value} 
										onCheckedChange={field.onChange} 
									/>
								</FormControl>
								<FormLabel>Receive mass text messages about important events?</FormLabel>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				
				<Separator />
				
				<FormField
					control={form.control}
					name="dept"
					render={({ field }) => (
						<FormItem className="basis-full flex flex-col min-w-2xs">
							<FormLabel className="font-headline-serif text-2xl">Department</FormLabel>
							<FormDescription className="my-0">
								What department are you enrolled in? Select "Other" if you don't see it,
							</FormDescription>
							<Popover open={open} onOpenChange={setOpen}>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={open}
											tabIndex={0} 
											className={cn(
												"min-w-[250px] max-w-fit justify-between bg-white",
												!field.value && "text-muted-foreground"
											)}
										>
											{field.value
												? depts.find(
														(dept) => dept.value === field.value
													)?.label
												: "Select Department"}
											<ChevronsUpDown className="opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="min-w-[250px] max-w-fit p-0">
									<Command>
										<CommandInput
											placeholder="Search Departments..."
											className="h-9"
										/>
										<CommandList>
											<CommandEmpty>No departments found.</CommandEmpty>
											<CommandGroup>
												{depts.map((dept) => (
													<CommandItem
														value={dept.label}
														key={dept.value}
														onSelect={() => {
															form.setValue("dept", dept.value)
															setOpen(false)
														}}
														className="text-card-foreground"
													>
														{dept.label}
														<Check
															className={cn(
																"ml-auto",
																"text-card-foreground",
																dept.value === field.value
																	? "opacity-100"
																	: "opacity-0"
															)}
														/>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
			
				{selectedDept === "OTHER" && (
					<FormField
						control={form.control}
						name="otherDept"
						render={({ field }) => (
							<FormItem className="basis-2/3 min-w-2xs">
								<FormLabel className="font-headline-serif text-2xl">Specify Other Department</FormLabel>
								<FormControl>
									<Input placeholder="What Department are you in?" {...field} />
								</FormControl>
								<FormMessage className="m-0" />
							</FormItem>
						)}
					/>
				)}
				
				<FormField
					control={form.control}
					name="subfield"
					render={({ field }) => (
						<FormItem className="basis-2/3 min-w-2xs">
							<FormLabel className="font-headline-serif text-2xl">Subfield <span class="text-current/40">(Optional)</span></FormLabel>
							<FormDescription className="my-0">
							 For example, your lab if you are in the sciences, or whether you are in literature or linguistics in the languages.
							</FormDescription>
							<FormControl>
								<Input placeholder="Subfield" {...field} />
							</FormControl>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
				<Separator />
				<FormField
					control={form.control}
					name="contract"
					render={({ field }) => (
						<FormItem className="space-y-3 basis-full">
							<FormLabel className="font-headline-serif text-2xl">Contract for 2025</FormLabel>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={field.value}
									className="flex flex-col"
								>
									<FormItem className="flex items-center gap-x-3">
										<FormControl>
											<RadioGroupItem value="saa-instructional" />
										</FormControl>
										<FormLabel className="font-normal block">
											<span className="font-bold">Instructional SAA:</span> You teach or grade for a section or class
										</FormLabel>
									</FormItem>
									<FormItem className="flex items-center gap-3">
										<FormControl>
											<RadioGroupItem value="saa-research" />
										</FormControl>
										<FormLabel className="font-normal block">
											<span className="font-bold">Research SAA:</span> You work in a lab or research group
										</FormLabel>
									</FormItem>
									<FormItem className="flex items-center gap-3">
										<FormControl>
											<RadioGroupItem value="saa-assisstant" />
										</FormControl>
										<FormLabel className="font-normal block">
											<span className="font-bold">Graduate Assisstant SAA:</span> You work at a journal or some other campus institution, but receive tuition remission
										</FormLabel>
									</FormItem>
									<FormItem className="flex items-center gap-3">
										<FormControl>
											<RadioGroupItem value="fellowship" />
										</FormControl>
										<FormLabel className="font-normal block">
											<span className="font-bold">Fellowship:</span> You are not working as an SAA this year
										</FormLabel>
									</FormItem>
									<FormItem className="flex items-center gap-3">
										<FormControl>
											<RadioGroupItem value="hourly" />
										</FormControl>
										<FormLabel className="font-normal block">
											<span className="font-bold">Hourly:</span> You work as an hourly employee
										</FormLabel>
									</FormItem>
									<FormItem className="flex items-center gap-3">
										<FormControl>
											<RadioGroupItem value="none" />
										</FormControl>
										<FormLabel className="font-normal block">
											<span className="font-bold">Not Employed by IU:</span> You are a graduate student but you are not employed by the university
										</FormLabel>
									</FormItem>
								</RadioGroup>
							</FormControl>
							
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
			
				<FormField
					control={form.control}
					name="location"
					render={({ field }) => (
						<FormItem className="basis-2/3 min-w-2xs">
							<FormLabel className="font-headline-serif text-2xl">Office Building/Room Number <span class="text-current/40">(Optional)</span></FormLabel>
							<FormControl>
								<Input placeholder="Wells 113" {...field} />
							</FormControl>
							<FormDescription className="m-0">What building/room is your office or lab, if you have one?</FormDescription>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
			
				<FormField
					control={form.control}
					name="year"
					render={({ field }) => (
						<FormItem className="basis-2/3 min-w-2xs">
							<FormLabel className="font-headline-serif text-2xl">Year Entered</FormLabel>
							<FormControl>
								<Input placeholder="Year" {...field} />
							</FormControl>
							<FormDescription className="m-0">What year did you enter your program at IU?</FormDescription>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
				<Separator />
				<FormField
					control={form.control}
					name="getInvolved"
					render={({ field }) => (
						<FormItem className="basis-full flex flex-wrap items-center">
							<FormControl>
								<Checkbox
									className="cursor-pointer"
									tabIndex={0}
									checked={field.value} 
									onCheckedChange={field.onChange} 
								/>
							</FormControl>
							<FormLabel className="font-headline-serif text-2xl">Get Involved!</FormLabel>
							<FormDescription className="basis-full m-0">Our goal is to sign up a majority of graduate workers on union cards.<br/> Would you be willing to help sign up grad workers in your department?</FormDescription>
							<FormMessage className="m-0" />
						</FormItem>
					)}
				/>
				<Separator />
				<Button className="cursor-pointer font-headline-serif text-2xl py-6 px-6 mx-auto" type="submit" tabIndex={0}>{isSubmitting ? "Signing..." : "Sign the Card!"}</Button>
			</form>
			)}
		</Form>
	)
}
