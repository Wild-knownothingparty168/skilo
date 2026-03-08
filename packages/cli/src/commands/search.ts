import { getClient } from '../api/client.js';
import { exitWithError, isJsonOutput, printJson, printKeyValue, printPrimary, printSection, printUsage } from '../utils/output.js';

export async function searchCommand(query: string): Promise<void> {
  if (!query) {
    printUsage(['Usage: skilo search <query>']);
  }

  try {
    const client = await getClient();
    const results = await client.searchSkills(query);

    if (isJsonOutput()) {
      printJson({
        command: 'search',
        query,
        total: results.length,
        results,
      });
      return;
    }

    if (results.length === 0) {
      printPrimary('No skills found');
      return;
    }

    printSection(`Found ${results.length} skill${results.length === 1 ? '' : 's'}`, 'primary');
    printPrimary('');
    for (const skill of results) {
      printPrimary(skill.installRef || `${skill.namespace}/${skill.name}`);
      printKeyValue('source', skill.sourceKind || 'skilo', 12);
      printKeyValue('label', `${skill.namespace}/${skill.name}`, 12);
      if (skill.description) {
        printKeyValue('description', skill.description, 12);
      }
      printPrimary('');
    }
  } catch (e) {
    exitWithError(`Search failed: ${(e as Error).message}`);
  }
}
