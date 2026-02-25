import { useRouteError, Link, isRouteErrorResponse } from 'react-router';

export default function ErrorPage() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found';
      message = "We couldn't find what you were looking for.";
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] text-center px-4">
      <p className="text-5xl mb-4">🍽️</p>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-gray-500 mb-6">{message}</p>
      <Link
        to="/"
        className="rounded-lg bg-[#E21833] text-white px-6 py-2 text-sm font-medium hover:bg-[#c01028]"
      >
        Back to Home
      </Link>
    </div>
  );
}
