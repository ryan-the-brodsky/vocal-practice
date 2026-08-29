import { Redirect } from 'expo-router';

// Courses live at the static route /courses (marketing group, for SEO). The
// in-app "Courses" tab navigates straight there (tabPress listener in
// app/(tabs)/_layout.tsx); this stub only catches direct /courses tab hits.
export default function CoursesRedirect() {
  return <Redirect href="/courses" />;
}
