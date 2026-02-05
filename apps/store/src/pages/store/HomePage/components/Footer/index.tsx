const Footer = () => {
	return (
		<footer className="bg-hero text-hero-foreground border-t border-hero-foreground/5">
			<div className="container mx-auto px-4 py-14">
				<div className="grid md:grid-cols-3 gap-10 mb-10">
					<div>
						<h3 className="text-lg font-bold mb-4 tracking-tight">בלסי סטור</h3>
						<p className="text-hero-muted text-sm leading-relaxed">
							ספק אונליין למשרדים בלבד.
							<br />
							מוצרי מזון, ניקיון והיגיינה במחירים שקופים.
						</p>
					</div>
					<div>
						<h4 className="font-semibold mb-4">קישורים מהירים</h4>
						<ul className="space-y-3 text-sm text-hero-muted">
							<li>
								<a href="#store" className="hover:text-hero-foreground transition-colors">
									חנות אונליין
								</a>
							</li>
							<li>
								<a href="#contact" className="hover:text-hero-foreground transition-colors">
									צור קשר
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h4 className="font-semibold mb-4">למשרדים</h4>
						<p className="text-sm text-hero-muted leading-relaxed">
							משרתים משרדים וארגונים בכל הארץ.
							<br />
							לקוחות עסקיים בלבד.
						</p>
					</div>
				</div>
				<div className="border-t border-hero-muted/20 pt-8 text-center text-sm text-hero-muted">
					<p>© {new Date().getFullYear()} בלסי סטור. כל הזכויות שמורות.</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
