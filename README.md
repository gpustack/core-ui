# GPUStack Core UI

`@gpustack/core-ui` provides shared UI components, hooks, and utilities extracted
from [GPUStack UI](https://github.com/gpustack/gpustack-ui). It supports GPUStack's
frontend architecture and evolves primarily around GPUStack's own product and
development needs.

## Usage and maintenance

This project currently has no dedicated usage documentation or integration guide.
When using it in another project, you may need to read the source code to
understand its APIs and adapt its dependencies, styling, and runtime context.

Maintenance prioritizes GPUStack's own requirements. We currently do not commit to
providing integration work or technical support for third-party use cases. Issues
and feature requests are evaluated based on project needs and available maintainer
capacity.

## JSON editor

`JsonEditor` provides controlled JSON input with optional schema guidance:

```tsx
import { JsonEditor } from '@gpustack/core-ui/json-editor';

<JsonEditor
  value={value}
  onChange={(text) => setValue(text ?? '')}
  schema={schema}
/>;
```

It shares the locally configured, lazy-loaded Monaco runtime with the YAML and diff editors. The host must bundle Monaco's JSON worker alongside its existing workers. Use a distinct, stable `path` for each explicit model; omitted paths are generated per editor. Schemas are scoped to that model and removed on unmount. `height`, `isDarkTheme` and `options` configure its presentation; input changes are not automatically reformatted.

## License

Licensed under the Apache License, Version 2.0. You may use, modify, and redistribute
this project subject to the license terms. See [LICENSE](LICENSE) for the full text.
