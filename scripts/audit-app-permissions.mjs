import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

// Local one-time audit tool only. Runtime code must use committed catalog modules, not repo scans.
const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const auditRoot = path.join(repoRoot, "docs", "permission-audit");
const appRootsPath = path.join(auditRoot, "app-roots.json");
const generatedPath = path.join(auditRoot, "generated", "permission-usage.json");
const permissionExpressionPattern = /^[A-Z][A-Z0-9_]*(?:\s+(?:OR|AND)\s+[A-Z][A-Z0-9_]*)*$/;
const sourceExtensionPattern = /\.(ts|js|vue)$/;
const skippedPathPattern = /(^|\/)(__tests__|__mocks__|fixtures?|test-data|mock-data)(\/|$)|\.(spec|test)\.(ts|js|vue)$/;

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  if (process.argv.includes("--validate-catalogs")) {
    await validateCatalogsPlaceholder();
    return;
  }

  const appConfigs = await loadAppConfigs();
  const apps = [];

  for (const config of appConfigs) {
    apps.push(await scanApp(config));
  }

  const audit = {
    schemaVersion: 1,
    apps
  };

  await fs.mkdir(path.dirname(generatedPath), { recursive: true });
  await fs.writeFile(generatedPath, `${JSON.stringify(audit, null, 2)}\n`);

  const usageCount = apps.reduce((total, app) => {
    return total + app.permissions.reduce((appTotal, permission) => appTotal + permission.usages.length, 0);
  }, 0);

  console.log(`Wrote ${generatedPath}`);
  console.log(`Scanned ${apps.length} apps and found ${usageCount} permission usages.`);
}

async function loadAppConfigs() {
  const rawConfig = JSON.parse(await fs.readFile(appRootsPath, "utf8"));
  if (!Array.isArray(rawConfig)) {
    throw new Error(`${appRootsPath} must contain an array of app root entries.`);
  }

  const configs = rawConfig.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`App root entry ${index + 1} must be an object.`);
    }
    if (!entry.appId || typeof entry.appId !== "string") {
      throw new Error(`App root entry ${index + 1} is missing a string appId.`);
    }
    if (!entry.root || typeof entry.root !== "string") {
      throw new Error(`App root entry ${entry.appId} is missing a string root.`);
    }

    return {
      appId: entry.appId,
      root: entry.root,
      resolvedRoot: path.resolve(repoRoot, entry.root),
      allowNoPermissions: entry.allowNoPermissions === true
    };
  });

  const validationErrors = [];
  for (const config of configs) {
    await validateDirectory(config.resolvedRoot, `${config.appId} root`, validationErrors);
    await validateDirectory(path.join(config.resolvedRoot, "src"), `${config.appId} src`, validationErrors);
  }

  if (validationErrors.length) {
    throw new Error(`Permission audit app root validation failed:\n${validationErrors.join("\n")}`);
  }

  return configs;
}

async function validateDirectory(directory, label, validationErrors) {
  try {
    const stat = await fs.stat(directory);
    if (!stat.isDirectory()) {
      validationErrors.push(`- ${label} is not a directory: ${directory}`);
    }
  } catch (error) {
    validationErrors.push(`- ${label} is missing or unreadable: ${directory} (${error.code || error.message})`);
  }
}

async function validateCatalogsPlaceholder() {
  const catalogCandidates = [
    path.join(auditRoot, "catalogs"),
    path.join(auditRoot, "permission-catalog.json"),
    path.join(auditRoot, "app-permission-catalog.json")
  ];
  const existingCatalogs = [];

  for (const candidate of catalogCandidates) {
    try {
      await fs.access(candidate);
      existingCatalogs.push(candidate);
    } catch {
      // Future catalog files are optional for Task 1.
    }
  }

  if (!existingCatalogs.length) {
    console.log("Catalog validation placeholder: no committed catalog files are present yet; skipping validation.");
    return;
  }

  console.log("Catalog validation placeholder: catalog files were found, but validation is reserved for a future task.");
}

async function scanApp(config) {
  const files = await collectAuditFiles(config.resolvedRoot);
  const actionMap = new Map();
  const permissionUsages = new Map();

  for (const file of files) {
    if (isActionsFile(file)) {
      const source = await fs.readFile(file, "utf8");
      for (const entry of extractActionMapEntries(source)) {
        actionMap.set(entry.action, entry.expression);
      }
    }
  }

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const relativeFile = toRelativeFile(config.resolvedRoot, file);

    for (const usage of extractUsages(source, relativeFile, file, actionMap)) {
      addUsage(permissionUsages, usage);
    }
  }

  const permissions = [...permissionUsages.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([permissionId, usages]) => ({
      permissionId,
      usages: [...usages.values()].sort(compareUsages)
    }));

  if (!permissions.length && !config.allowNoPermissions) {
    throw new Error(`No permissions detected for ${config.appId}; set allowNoPermissions true only for intentionally empty apps.`);
  }

  return {
    appId: config.appId,
    root: config.root,
    ...(config.allowNoPermissions ? { allowNoPermissions: true } : {}),
    permissions
  };
}

async function collectAuditFiles(root) {
  const files = [];
  const envExample = path.join(root, ".env.example");

  try {
    const stat = await fs.stat(envExample);
    if (stat.isFile()) files.push(envExample);
  } catch {
    // Apps without an .env.example are still valid scan roots.
  }

  const srcRoot = path.join(root, "src");
  await collectSourceFiles(srcRoot, files);
  return files;
}

async function collectSourceFiles(directory, files) {
  const entries = (await fs.readdir(directory, { withFileTypes: true }))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      await collectSourceFiles(fullPath, files);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!sourceExtensionPattern.test(entry.name)) continue;
    if (skippedPathPattern.test(toPosix(fullPath))) continue;
    files.push(fullPath);
  }
}

function extractUsages(source, relativeFile, absoluteFile, actionMap) {
  const usages = [];

  for (const expression of matchLiteralArgument(source, /\bhasPermission\s*\(\s*(["'`])([\s\S]*?)\1/g)) {
    usages.push(...buildExpressionUsages(expression, relativeFile, "has-permission"));
  }

  const actionReferencePattern = /\bhasPermission\s*\(\s*Actions\.([A-Z][A-Z0-9_]*)\s*\)/g;
  for (const match of source.matchAll(actionReferencePattern)) {
    const expression = actionMap.get(match[1]);
    if (!expression) continue;
    usages.push(...buildExpressionUsages(expression, relativeFile, "has-permission-action", `Actions.${match[1]}`));
  }

  if (isRouterIndexFile(absoluteFile)) {
    const permissionIdPattern = /\bpermissionId\s*:\s*(["'`])([\s\S]*?)\1/g;
    for (const expression of matchLiteralArgument(source, permissionIdPattern)) {
      usages.push(...buildExpressionUsages(expression, relativeFile, "route-meta"));
    }
  }

  if (path.basename(absoluteFile) === ".env.example") {
    usages.push(...extractEnvUsages(source, relativeFile));
  }

  if (isActionsFile(absoluteFile)) {
    for (const entry of extractActionMapEntries(source)) {
      usages.push(...buildExpressionUsages(entry.expression, relativeFile, "action-map", entry.action));
    }
  }

  return usages;
}

function matchLiteralArgument(source, pattern) {
  const expressions = [];

  for (const match of source.matchAll(pattern)) {
    const expression = normalizeExpression(match[2]);
    if (isPermissionExpression(expression)) expressions.push(expression);
  }

  return expressions;
}

function extractEnvUsages(source, relativeFile) {
  const usages = [];
  const envPattern = /^(VITE_APP_PERMISSION_ID|VUE_APP_PERMISSION_ID|VITE_PERMISSION_ID|VITE_VUE_APP_PERMISSION_ID)\s*=\s*(.*)$/gm;

  for (const match of source.matchAll(envPattern)) {
    const expression = normalizeEnvValue(match[2]);
    if (!isPermissionExpression(expression)) continue;
    usages.push(...buildExpressionUsages(expression, relativeFile, "env"));
  }

  return usages;
}

function extractActionMapEntries(source) {
  const defaultExport = source.match(/export\s+default\s*\{([\s\S]*?)\}\s*(?:as\s+any)?\s*;?/);
  if (!defaultExport) return [];

  const entries = [];
  const propertyPattern = /(?:^|,|\n)\s*(?:(["'])([A-Z][A-Z0-9_]*)\1|([A-Z][A-Z0-9_]*))\s*:\s*(["'])([\s\S]*?)\4/g;

  for (const match of defaultExport[1].matchAll(propertyPattern)) {
    const action = match[2] || match[3];
    const expression = normalizeExpression(match[5]);
    if (!isPermissionExpression(expression)) continue;
    entries.push({ action, expression });
  }

  return entries;
}

function buildExpressionUsages(expression, file, kind, context = expression) {
  return splitPermissionExpression(expression).map((permissionId) => ({
    permissionId,
    usage: {
      file,
      context,
      kind
    }
  }));
}

function splitPermissionExpression(expression) {
  return expression.split(/\s+(?:OR|AND)\s+/).filter(Boolean);
}

function addUsage(permissionUsages, { permissionId, usage }) {
  if (!permissionUsages.has(permissionId)) {
    permissionUsages.set(permissionId, new Map());
  }

  const usageKey = `${usage.file}\0${usage.context}\0${usage.kind}`;
  permissionUsages.get(permissionId).set(usageKey, usage);
}

function compareUsages(a, b) {
  return (
    a.file.localeCompare(b.file) ||
    a.kind.localeCompare(b.kind) ||
    a.context.localeCompare(b.context)
  );
}

function normalizeEnvValue(value) {
  return normalizeExpression(value.replace(/\s+#.*$/, ""));
}

function normalizeExpression(value) {
  return value.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, " ");
}

function isPermissionExpression(expression) {
  return Boolean(expression) && permissionExpressionPattern.test(expression);
}

function isActionsFile(file) {
  const normalized = toPosix(file);
  return /\/authorization\/Actions\.(ts|js|vue)$/.test(normalized);
}

function isRouterIndexFile(file) {
  return /\/src\/router\/index\.(ts|js|vue)$/.test(toPosix(file));
}

function toRelativeFile(root, file) {
  return toPosix(path.relative(root, file));
}

function toPosix(file) {
  return file.split(path.sep).join("/");
}
