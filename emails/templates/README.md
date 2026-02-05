Place your custom email HTML templates in this folder.

Naming:
- Use a short name like `welcome.html` or `order-placed.html`.
- Optional plain-text version: use the same name with `.txt` (e.g., `welcome.txt`).

Template variables:
- Use `{{variable}}` placeholders inside your template.
- Example: `Hello {{name}}, your order {{orderNumber}} is confirmed.`

Usage:
- Import the mailer and call `sendEmail` with a template name.
```ts
import { sendEmail } from '@/lib/mailer';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to WayToLab',
  template: 'welcome',
  vars: { name: 'Asha' }
});
```
