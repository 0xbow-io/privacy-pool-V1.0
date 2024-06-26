## Simulation functions for asp-provider package
Runs a local http server that simulates an actual API call utilizing functions from this package. You can use this
as a playground to see the functions in action. Postman is required for this.

1. Install dependencies:
```bash
bun install
```

2. Navigate to the simulate folder
```bash
cd simulate
```

3. To run (note: --watch mode, which hard restarts Bun's process when imported files change. So you can make adjustments to the code and see the changes without restarting the service):

```bash
bun --watch index.ts
```

4. Use postman to test, the url for inclusion is below:
```bash
http://localhost:3030/association/inclusion

or

http://localhost:3030/association/exclusion
```