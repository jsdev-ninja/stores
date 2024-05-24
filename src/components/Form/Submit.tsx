export function Submit(props) {
	const { children, fullWidth } = props;

	return (
		<button
			type="submit"
			className="border p-4 rounded h-12 bg-primary-main hover:bg-primary-dark active:bg-primary-light text-white  flex items-center justify-center"
		>
			{children}
		</button>
	);
}
