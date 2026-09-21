# PIPE.ID Settings / Auth Update

## Included changes

- Settings split into Profile, Appearance, Security, and Data pages.
- Profile avatar camera includes a visible 1:1 capture frame.
- Mobile Login/Register are vertically centered using the mobile viewport.
- Account creation and login accept Gmail addresses only (`@gmail.com`).
- Backup email accepts Gmail only.
- Phone/WhatsApp requires a selected country and digits-only local number.
- Stored phone value uses international format such as `+6281234567890`.
- Change Email requires the current password before `PIPE.ID backend change-email API` is called.
- Security migration includes database checks for Gmail backup emails and international numeric phone values.

## Backend settings

Security settings are stored through the PIPE.ID backend API.

The migration adds `backup_email` and `phone_whatsapp` if missing and adds validation constraints.
