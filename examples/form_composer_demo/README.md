These form-based questionnaires are example of FormComposer task generator.

---

## How to run

1. In repo root, launch containers: `docker-compose -f docker/docker-compose.dev.yml up`
2. SSH into running container to run server: `docker exec -it mephisto_dc bash`
3. Inside the container, go to FormComposer examples directory: `cd /mephisto/examples/form_composer_demo`
4. Inside the `examples` directory, run a desired example with one of these commands:
   - Simple form with In-House provider: `python ./run_task__local__inhouse.py`
   - Dynamic form with In-House provider: `python ./run_task_dynamic__local__inhouse.py`
   - Dynamic form with Mturk on EC2: `python ./run_task_dynamic__ec2__mturk_sandbox.py`
   - Dynamic form with Prolific on EC2: `python ./run_task_dynamic__ec2__prolific.py`
   - Dynamic form with Presigned URLs: `python ./run_task_dynamic_presigned_urls__ec2__prolific.py`
   - Simple form with Gold Units: `python ./run_task_with_gold_unit__local__inhouse.py`
   - Simple form with Onboarding: `python ./run_task_with_onboarding__local__inhouse.py`
   - Simple form with Screening: `python ./run_task_with_screening__local__inhouse.py`
   - Simple form with Worker Opinion: `python ./run_task_with_worker_opinion__local__inhouse.py`

---

## How to configure

1. For simple form config you need to provide FormComposer with one JSON file - a configuration of your form fields. An example is found in `examples/form_composer_demo/data/simple/task_data.json` file.
2. For dynamic form configs you need two JSON files in `examples/form_composer_demo/data/dynamic` directory:
   - Unit configuration `unit_config.json`
   - Token sets values `token_sets_values_config.json`
   - To generate extrapolated `task_data.json` config, run this command: `mephisto form_composer config --extrapolate-token-sets`
       - Note that `task_data.json` file will be overwritten with the resulting config
3. To generate `token_sets_values_config.json` file from token values permutations in `separate_token_values_config.json`, run this command: `mephisto form_composer config --permutate-separate-tokens`
    - Note that `token_sets_values_config.json` file will be overwriten with new sets of tokens values

---

#### Unit config

For details on how form config is composed, and how its data fields are validated, please see the main FormComposer's [README.md](/mephisto/generators/form_composer/README.md).

---

## End-to-end example

Now let's see how the whole end-to-end list of commands looks for the example `Sample Questionnaire` with presigned URLs:

```shell
# 1. In your console

docker-compose -f docker/docker-compose.dev.yml up
docker exec -it mephisto_dc bash

# 2.Inside Docker container

# 2a. Optionally, prepare config (re-generate `task_data.json`)
mephisto form_composer config --directory /mephisto/examples/form_composer_demo/data/dynamic_presigned_urls/ --permutate-separate-tokens
mephisto form_composer config --directory /mephisto/examples/form_composer_demo/data/dynamic_presigned_urls/ --extrapolate-token-sets

# 2b. Run the Task
cd /mephisto/examples/form_composer_demo
python ./run_task_dynamic_presigned_urls__ec2__prolific.py
```
