import { exec } from 'child_process';

export default function (option, cmd): Promise<string> {
  console.log('\u001b[36mcommand:\u001b[0m', cmd);

  return new Promise((resolve, reject) => {
    exec(cmd, option, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        return reject();
      }

      console.log(stdout);
      console.log(stderr);

      resolve(stdout.toString().replace(/\n$/g, ''));
    });
  });
}
