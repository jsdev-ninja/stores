export default function MaintenancePage() {
	return (
		<div
			className="min-h-screen flex items-center justify-center bg-[#f5f4f2] px-4"
			dir="rtl"
		>
			<div className="w-full max-w-[540px]">
				{/* Accent bar */}
				<div className="h-1 w-full rounded-t-lg" style={{ backgroundColor: "#bfb9b0" }} />

				{/* Card */}
				<div className="bg-white rounded-b-2xl shadow-md px-10 py-10 flex flex-col items-center text-center">
					{/* Icon */}
					<span className="text-5xl mb-5" aria-hidden="true">
						🔧
					</span>

					{/* Hebrew heading */}
					<h1 className="text-[1.75rem] font-bold text-gray-900 mb-2">
						המערכת בתחזוקה
					</h1>

					{/* Hebrew subtitle */}
					<p className="text-gray-500 mb-6">
						אנחנו מבצעים עדכון. נחזור בקרוב.
					</p>

					{/* Divider */}
					<hr className="w-full border-gray-100 mb-6" />

					{/* English block */}
					<p className="text-gray-400 text-sm" dir="ltr">
						We&apos;re updating the system. Back online soon.
					</p>

					{/* Brand name */}
					<p className="mt-8 text-gray-300 text-sm lowercase tracking-wide">
						storebrix
					</p>
				</div>
			</div>
		</div>
	);
}
