import { Redirect } from 'expo-router';

// Courses live at the static route /courses (marketing group, for SEO). The
// in-app "Courses" tab navigates straight there (tabPress listener in
// app/(tabs)/_layout.tsx). The file is named `curriculum` on purpose: a `courses.tsx`
// here would export dist/courses.html and shadow the marketing /courses/ page
// (same reason the Learn tab file is `library.tsx`). The stub only catches
// direct /curriculum hits.
export default function CoursesRedirect() {
  return <Redirect href="/courses" />;
}
