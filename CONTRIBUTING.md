# Contributing to Jellyfin Web

Thanks for taking the time to contribute! :purple_heart:
Jellyfin is an entirely volunteer-driven project, so without contributors like you it could not exist!

Below are some general guidelines and information about this project.
If you have any questions, please join one of our [development chat rooms](https://jellyfin.org/contact/) to discuss them!

## Contributor Guidelines

### New Code

* New files **MUST** be written in TypeScript.
* API interactions **MUST** be made using the Jellyfin TypeScript SDK.
* **SHOULD** be covered by unit tests when possible (legacy component/view code is deemed untestable).
* **SHOULD** avoid whitespace only changes in unchanged sections of code.
* **SHOULD NOT** overuse dynamic imports. We use dynamic imports at the page level; otherwise we should let our build tooling deal with code-splitting for the best bundle sizes.
* **SHOULD NOT** reference browser globals. Globals exist for plugins/legacy compatibility. Use direct imports for any dependencies instead.

### Localization

* Translation changes or additions **MUST** be made via the [Jellyfin Weblate instance](https://translate.jellyfin.org/) except for the source language (`en-us`).
* Existing translation keys **SHOULD NOT** be renamed without a significant reason. Weblate cannot track key name changes so a key name change requires retranslation in ALL languages.

### Pull Requests

* **MUST** follow [project guidelines](https://jellyfin.org/docs/general/contributing/development#pull-request-guidelines).
  * **SHOULD NOT** use "Conventional Commits" for titles or commit messages.
  * **SHOULD NOT** rebase once reviews are in progress.
* **MUST** follow the [LLM development policy](https://jellyfin.org/docs/general/contributing/llm-policies).
* **MUST** test that the change works as expected before marking a PR as ready for review.
* **SHOULD** represent a singular focus (i.e. a PR to fix a bug should not include unrelated refactoring).
* **SHOULD NOT** update from `master` needlessly once opened (only update if conflicts exist).

## Application Architecture

### Tech Stack

* [Bulletproof React based structure](https://forum.jellyfin.org/t-proposed-update-to-the-structure-of-jellyfin-web) ([official reference](https://github.com/alan2207/bulletproof-react/blob/master/README.md)) &mdash; General file structure
* [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html) &mdash; Programming language
* [Jellyfin TypeScript SDK](https://typescript-sdk.jellyfin.org/) &mdash; Jellyfin API library
* [React](https://react.dev/reference/react) &mdash; User Interface library
* [React Router](https://reactrouter.com/) &mdash; Routing library
* [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) &mdash; State management library for server data
* [MUI](https://mui.com/material-ui/getting-started/) components (in Dashboard and Experimental layouts) &mdash; UI component library
* [Webpack](https://webpack.js.org/concepts/) &mdash; Bundler / build tooling
* [Vitest](https://vitest.dev/api/) &mdash; Test library

#### Legacy Stack

| Library | Replacement |
| --- | --- |
| [Emby WebComponents](https://github.com/jellyfin/jellyfin-web/tree/master/src/elements) | MUI components (Dashboard + Experimental apps ONLY; Untested on TVs) |
| [App Router](https://github.com/jellyfin/jellyfin-web/blob/master/src/components/router/appRouter.js) | React Router |
| [View Manager](https://github.com/jellyfin/jellyfin-web/tree/master/src/components/viewManager) | React Router |
| [Jellyfin ApiClient](https://github.com/jellyfin-archive/jellyfin-apiclient-javascript) | Jellyfin TypeScript SDK |
| [jQuery](https://api.jquery.com/) | None (use plain JavaScript/TypeScript) |

#### Supported Browsers

This codebase supports a wide variety of platforms including TVs that are stuck on ancient versions of browser engines.
As a result, we can only use JavaScript and CSS features that are either directly supported by these browser versions or can be otherwise compiled or polyfilled for compatibility.
The official list of supported browser versions can be found in the `browserlist` section of the [package.json file](https://github.com/jellyfin/jellyfin-web/blob/master/package.json).

## Application Components

* Stable App `src/apps/stable`
  * Main user application
  * Supports TV layout
* Experimental App `src/apps/experimental`
  * Ongoing rewrite of the Stable App using MUI components
  * Currently reuses (most) pages from the Stable App to maintain parity
  * Does not currently support TV layout!
* Dashboard App `src/apps/dashboard`
  * Admin dashboard and metadata editor pages
  * Almost completely rewritten using MUI components
  * No TV support (dashboard pages are not available)
* Wizard App `src/apps/wizard`
  * First time setup wizard
* Plugins `src/plugins`
  * This is a terrible name as it has nothing to do with server plugins
  * Modular functionality that is loaded dynamically at runtime
  * ALL media player implementations are plugins
  * Allows native wrapper overrides
