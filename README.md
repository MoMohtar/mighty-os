# MIGHTY OS

A personal productivity dashboard built with React, Vite, Tailwind CSS, and browser-local storage.

## Run locally

```powershell
npm install
npm run dev
```

Create a production build with `npm run build`.

All personal data is saved in this browser's local storage. Use **Settings → Export backup** to download a JSON copy.

## Publish with GitHub Pages

The GitHub Actions workflow builds and deploys this app on every push to `main`.
Create a GitHub repository named `mighty-os`, push this project to its `main`
branch, then open **Settings → Pages** and select **GitHub Actions** as the
build and deployment source. The workflow can also be started manually from the
Actions tab.

The Pages site is public even if the source repository is private. GitHub only
allows Pages deployments from private repositories on eligible paid plans.
After the first successful deployment, GitHub shows the live URL in the
workflow deployment environment; it follows the pattern
`https://<your-github-username>.github.io/mighty-os/`.

The app uses hash-based routes so direct links and refreshes work on GitHub
Pages. User data is stored in each visitor's own browser and is not included in
the published site.
