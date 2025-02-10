import inquirer from "inquirer";

async function main() {
	const answers = await inquirer.prompt([
		{ type: "input", name: "name", message: "Enter project name:" },
		{
			type: "list",
			name: "framework",
			message: "Choose a framework",
			choices: ["React", "Vue", "Svelte"],
		},
	]);

	console.log(answers);
}

main();
