export function isProfileVerified(profile) {
  return (
    Number.isInteger(profile?.years_experience) &&
    (profile.is_student === 0 || profile.is_student === 1) &&
    typeof profile.degree === "string" &&
    profile.degree.trim().length > 0 &&
    typeof profile.branch === "string" &&
    profile.branch.trim().length > 0 &&
    Number.isInteger(profile.passing_year)
  );
}
