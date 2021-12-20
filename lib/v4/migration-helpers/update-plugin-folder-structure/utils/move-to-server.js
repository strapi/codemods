const { join } = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const { logger } = require('../../../../global/utils');

async function moveToServer(v4Plugin, originDir, serverDir) {
  const exists = await fs.pathExists(join(v4Plugin, originDir, serverDir));
  if (!exists) return;

  const origin = join(v4Plugin, originDir, serverDir);
  const destination = join(v4Plugin, 'server', serverDir);
  await fs.move(origin, destination);

  const destinationLog =
    serverDir === 'models' ? join(v4Plugin, 'server', 'content-types') : destination;
  logger.info(`moved ${chalk.yellow(serverDir)} to ${chalk.yellow(destinationLog)}`);
}

module.exports = moveToServer;
