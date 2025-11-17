import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Get __dirname in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Get the only folder inside ./managed
const managedPath = path.join(__dirname, 'managed');
const [folder] = fs.readdirSync(managedPath).filter(f => fs.statSync(path.join(managedPath, f)).isDirectory());
// Dynamically import the contract
const { Ledger } = await import(`./managed/${folder}/contract/index.cjs`);
export const createCounterPrivateState = (secretKey) => ({
    secretKey,
});
export const witnesses = {
    secretKey: ({ privateState }) => {
        return [privateState, privateState.secretKey];
    },
};
//# sourceMappingURL=witnesses.js.map