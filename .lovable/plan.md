# Show the student's institution in "Meu espaço"

## What changes
- At the top of the student's "Meu espaço", next to the "Olá, Nome" greeting, show a small badge with the logo and name of the institution the student is linked to (for example Afya).
- If the institution has no logo, show a building icon in its place.
- If the student is linked to more than one institution, show each one side by side.
- Students without an institution see the page exactly as it is today.
- Only the student's own links are read, so no other student's information is involved.

## Technical details
- In `src/pages/StudentHome.tsx`, query `patient_institutions` joined with `educational_institutions(name, logo_url)`, filtered by the student's own `pacientes` record, using react-query so it refreshes with the rest of the page.
- Render the badge under the greeting, using semantic tokens and `data-no-translate` on the institution name.
- Check the existing access rules let a student read their own link and the institution's name/logo; if not, add a narrow read rule.
