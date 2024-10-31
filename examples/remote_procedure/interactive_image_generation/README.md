This is an example of an iteractive Task built with FormComposer.

---

## Task Flow

At a high level, here's what this Task entails:

- Worker's goal is to compose a Generative AI text prompt to produce an image that closely resembles initially displayed "target" image
- Worker is given up to `max_answer_loops` attempts to achieve the goal
    - Each attempt consists of judging the generated image (with the resemblance `score`), and updating the text prompt
        - Worker cannot reuse exactly the same text prompt from any of the previous attempts
    - Goal is reached if worker indicates `score=10` in their response (perfect resemblance is achieved)
- After receiving each attempt, based on the updated text prompt the server produces a new image and extra instruction
    - Here we're picking a random locally stored image, but this could also be a request to a 3rd party API
    - Extra instruction shown to worker will vary, depending on provided score

-----

## How to run

1. In repo root, launch containers: `docker-compose -f docker/docker-compose.dev.yml up`
2. SSH into running container to run server: `docker exec -it mephisto_dc bash`
3. Inside the container, go to FormComposer examples directory: `cd /mephisto/examples/remote_procedure/interactive_image_generation`
4. Inside the examples directory, run `python ./run_task__local__inhouse.py`

---

## How to configure

_This step is optional and can be skipped._

To change target images (their amount and URLs), as well as form instructions/fields,
you will need to edit the provided dynamic FormComposer config.

To create form-based Tasks, you need to provide FormComposer with one JSON file ("task config") containing  configuration of all your form fields.
- An example is found in `examples/remote_procedure/interactive_image_generation/data/task_data.json` file.
- This particular example includes several variations of a form shown to workers (hence the form config is "dynamic"). You can compose these form variations manually (in `task_data.json` file) or automatically.

#### Auto-generated Task config

To generate form variations for task config automatically, you need these JSON files in `examples/remote_procedure/interactive_image_generation/data/` directory:
- The main form config `unit_config.json`
- Token values `separate_token_values_config.json`

Here's how generating form variations automatically works:
- Each form variation is produced by a set of token values (`token_set`) that are plugged into variable parts (`tokens`) of text/instructions in the main form config (in `unit_config.json` file)
    - If there's more than one token in form config, token sets defining the desired form variations can be specified manually (in `token_sets_values_config.json` file), or generated automatically as all possible permutations of all tokens values (using `--permutate-separate-tokens` command option
- The token sets are plugged into the main form config (using `--extrapolate-token-sets` command option) and the resulting `task_data.json` task config is created.

These are the commands to run to generate form variations:
1. Generate `token_sets_values_config.json` file from token values permutations in `separate_token_values_config.json`, run this command: `mephisto form_composer config --permutate-separate-tokens`
    - Note that `token_sets_values_config.json` file will be overwriten with new sets of tokens values
2. Generate extrapolated `task_data.json` config, run this command: `mephisto form_composer config --extrapolate-token-sets`
    - Note that `task_data.json` file will be overwritten with the resulting config

#### Main form config file

For details on how the main form config is structured and validated, please refer to FormComposer [README.md](/mephisto/generators/form_composer/README.md).

---

## End-to-end example

Now let's see how the whole end-to-end list of commands looks like for the example `Dynamic form with Interactive form`:

```shell
# 1. In your console

docker-compose -f docker/docker-compose.dev.yml up
docker exec -it mephisto_dc bash

# 2.Inside Docker container

# 2a. Optionally, prepare config (re-generate `task_data.json`)
mephisto form_composer config --directory /mephisto/examples/remote_procedure/interactive_image_generation/data/ --permutate-separate-tokens
mephisto form_composer config --directory /mephisto/examples/remote_procedure/interactive_image_generation/data/ --extrapolate-token-sets

# 2b. Run the Task
cd /mephisto/examples/remote_procedure/interactive_image_generation
python ./run_task__local__inhouse.py
```
