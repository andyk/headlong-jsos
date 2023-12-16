import { JsosSession } from '@andykon/jsos/src'
import supabase from "./supabase";
import * as fs from 'fs';
import * as path from 'path';

interface SyncVarParams {
    varName: string;
    varNamespace?: string;
}

async function syncVar(params: SyncVarParams): Promise<void> {
    const jsos = new JsosSession().addInMemory().addSupabase(supabase);

    const headlong = params.varNamespace ? (
        await jsos.getImmutableVar({ name: params.varName, namespace: params.varNamespace })
    ) : (
        await jsos.getImmutableVar({ name: params.varName })
    );

    if (!headlong) {
        console.log(`Var ${params.varName} does not exist in JSOS. Exiting`);
        return;
    }

    const dirPath = path.join(__dirname, 'headlong-v2-agents');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    headlong.agents.forEach((name, agent) => { 
        const filePath = path.join(dirPath, `${name}.json`);
        fs.writeFileSync(filePath, agent.thoughts.map(([thought, history]) => thought.body.join('\n')));
        console.log(`Var ${params.varName} has been synced to ${filePath}`);
    })
}

const params = { varName: 'headlong', varNamespace: 'headlong-vite-v2' };
syncVar(params)
    .then(() => console.log(`Var ${params.varName} written to file successfully.`))
    .catch(error => console.error('Error writing file from headlong-vite-v2/headlong var:', error));