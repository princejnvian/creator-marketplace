import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* Logo */}
          <Link href="/" className="text-2xl font-bold tracking-tight">
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 md:flex">

            <Link
              href="#categories"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Explore
            </Link>

            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              How it works
            </Link>

            <Link
              href="/signup"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Become a Freelancer
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>

          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">

            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Sign Up
            </Link>

          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center md:py-28">

          <div className="mx-auto max-w-4xl">

            {/* Badge */}
            <div className="mb-8 inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm">
              India's Creator Marketplace
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-950 md:text-7xl">
              Find Talented
              <br />

              <span className="text-blue-600">
                creators
              </span>{" "}
              for your
              <br />

              YouTube channel.
            </h1>

            {/* Description */}
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
              Find video editors, thumbnail designers, and voice-over artists
              in one place. Choose the perfect creator for your project and
              budget.
            </p>

            {/* Search */}
            <div className="mx-auto mt-10 flex max-w-2xl rounded-xl border border-gray-300 bg-white p-2 shadow-lg">

              <input
                type="text"
                placeholder="What do you need? e.g. YouTube video editing"
                className="min-w-0 flex-1 px-4 py-3 text-sm outline-none md:text-base"
              />

              <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 md:px-8">
                Search
              </button>

            </div>

            {/* Popular Searches */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">

              <span>Popular:</span>

              <Link
                href="#categories"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 hover:border-blue-300 hover:text-blue-600"
              >
                Video Editing
              </Link>

              <Link
                href="#categories"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 hover:border-blue-300 hover:text-blue-600"
              >
                Thumbnails
              </Link>

              <Link
                href="#categories"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 hover:border-blue-300 hover:text-blue-600"
              >
                Voice Over
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* Categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-6 py-20 md:py-24"
      >

        <div className="text-center">

          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            What do you need?
          </h2>

          <p className="mt-3 text-gray-600">
            Find the right freelancer for your next YouTube project.
          </p>

        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">

          <Category
            emoji="🎬"
            title="Video Editing"
            description="Shorts, Reels, long-form videos, documentaries, and more."
          />

          <Category
            emoji="🖼️"
            title="Thumbnail Design"
            description="Eye-catching YouTube thumbnails designed to get more clicks."
          />

          <Category
            emoji="🎙️"
            title="Voice Over"
            description="Professional Hindi, Hinglish, Urdu, and English voice artists."
          />

        </div>

      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-gray-50 px-6 py-20 md:py-24"
      >

        <div className="mx-auto max-w-7xl">

          <div className="text-center">

            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How it works
            </h2>

            <p className="mt-3 text-gray-600">
              Getting your YouTube project done is simple.
            </p>

          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">

            <Step
              number="01"
              title="Find a freelancer"
              description="Browse portfolios, compare prices, and choose the creator who fits your project."
            />

            <Step
              number="02"
              title="Discuss your project"
              description="Talk directly with the freelancer and share your requirements."
            />

            <Step
              number="03"
              title="Get your work done"
              description="Place your order, receive your work, and leave a review."
            />

          </div>

        </div>

      </section>

      {/* Freelancer CTA */}
      <section className="px-6 py-24 text-center">

        <div className="mx-auto max-w-3xl">

          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Turn your creative skills into income.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Are you a video editor, thumbnail designer, or voice-over artist?
            Create your profile, showcase your work, and start finding clients.
          </p>

          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Become a Freelancer
          </Link>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-10">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">

          <div className="text-xl font-bold">
            YOUTENT<span className="text-blue-600">.</span>
          </div>

          <p className="text-sm text-gray-500">
            © 2026 YOUTENT. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}


/* Category Component */
function Category({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 transition duration-200 hover:-translate-y-1 hover:shadow-xl">

      <div className="text-4xl">
        {emoji}
      </div>

      <h3 className="mt-5 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-gray-600">
        {description}
      </p>

      <Link
        href="/signup"
        className="mt-6 inline-block font-semibold text-blue-600 hover:text-blue-700"
      >
        Explore →
      </Link>

    </div>
  );
}


/* Step Component */
function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md">
        {number}
      </div>

      <h3 className="mt-5 text-xl font-bold">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-sm leading-7 text-gray-600">
        {description}
      </p>

    </div>
  );
}