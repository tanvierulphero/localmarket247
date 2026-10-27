import fs from 'fs';
import path from 'path';
import { escapeSql, generateSqlForEntity } from './sqlFormatter';

export { escapeSql, generateSqlForEntity };

/**
 * Escapes regex special characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Target SQL files list to maintain in perfect synchronization
 */
export function getSqlTargetFiles(): string[] {
  return [
    path.join(process.cwd(), 'database.sql'),
    path.join(process.cwd(), 'schema.sql'),
    path.join(process.cwd(), 'public', 'schema.sql'),
    path.join(process.cwd(), 'public', 'database.sql')
  ];
}

/**
 * Appends or updates the SQL entry in database.sql, schema.sql and public/*.sql
 */
export function appendSqlToFiles(table: string, item: any) {
  const sqlStatement = generateSqlForEntity(table, item);
  if (!sqlStatement) return;

  const targetFiles = getSqlTargetFiles();
  const marker = '-- REAL-TIME ADMIN PANEL LIVE ENTRIES';
  const headerBlock = `\n-- ------------------------------------------------------------------------------\n-- REAL-TIME ADMIN PANEL LIVE ENTRIES\n-- ------------------------------------------------------------------------------\n`;

  for (const filePath of targetFiles) {
    try {
      // Ensure file exists
      if (!fs.existsSync(filePath)) {
        const baseSchema = path.join(process.cwd(), 'schema.sql');
        if (fs.existsSync(baseSchema)) {
          fs.copyFileSync(baseSchema, filePath);
        } else {
          continue;
        }
      }

      let content = fs.readFileSync(filePath, 'utf-8');

      // 1. Look for an existing single INSERT statement for this specific table & item.id
      // Regex matches: INSERT INTO `table` ... VALUES ('<id>', ...);
      const exactPattern = new RegExp(`INSERT INTO \\\`${table}\\\`[^;]*VALUES\\s*\\('${escapeRegExp(item.id)}'[^;]*;\\n*`, 'm');

      if (exactPattern.test(content)) {
        content = content.replace(exactPattern, `${sqlStatement}\n`);
        fs.writeFileSync(filePath, content, 'utf-8');
        continue;
      }

      // 2. If not found, append under the live entries section
      if (!content.includes(marker)) {
        const fkcIndex = content.lastIndexOf('SET FOREIGN_KEY_CHECKS = 1;');
        if (fkcIndex !== -1) {
          content = content.slice(0, fkcIndex) + headerBlock + `${sqlStatement}\n\n` + content.slice(fkcIndex);
        } else {
          content += headerBlock + `${sqlStatement}\n\n`;
        }
      } else {
        // Append right before SET FOREIGN_KEY_CHECKS = 1;
        const fkcIndex = content.lastIndexOf('SET FOREIGN_KEY_CHECKS = 1;');
        if (fkcIndex !== -1) {
          content = content.slice(0, fkcIndex) + `${sqlStatement}\n\n` + content.slice(fkcIndex);
        } else {
          content += `\n${sqlStatement}\n`;
        }
      }

      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (err) {
      console.error(`Failed to sync SQL to ${filePath}:`, err);
    }
  }
}

/**
 * Handles deletion from SQL files
 */
export function appendDeleteSqlToFiles(table: string, id: string) {
  const deleteStatement = `DELETE FROM \`${table}\` WHERE \`id\` = ${escapeSql(id)};`;
  const targetFiles = getSqlTargetFiles();

  for (const filePath of targetFiles) {
    try {
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath, 'utf-8');

      // Remove any previously inserted single statement for this ID
      const exactPattern = new RegExp(`INSERT INTO \\\`${table}\\\`[^;]*VALUES\\s*\\('${escapeRegExp(id)}'[^;]*;\\n*`, 'm');
      if (exactPattern.test(content)) {
        content = content.replace(exactPattern, '');
      }

      // Also append explicit delete statement before SET FOREIGN_KEY_CHECKS = 1; so imports wipe previous entries
      const fkcIndex = content.lastIndexOf('SET FOREIGN_KEY_CHECKS = 1;');
      if (fkcIndex !== -1) {
        content = content.slice(0, fkcIndex) + `${deleteStatement}\n\n` + content.slice(fkcIndex);
      } else {
        content += `\n${deleteStatement}\n`;
      }

      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (err) {
      console.error(`Failed to sync delete to ${filePath}:`, err);
    }
  }
}
