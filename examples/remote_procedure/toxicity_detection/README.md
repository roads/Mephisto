<!---
  Copyright (c) Meta Platforms and its affiliates.
  This source code is licensed under the MIT license found in the
  LICENSE file in the root directory of this source tree.
-->

# Mephisto Toxicity Detection Demo

## Summary

This task presents the worker with a text input.

Written text can only be submitted if its toxicity is calculated to be <= 0.5. 
If the toxicity is > 0.5 an alert is shown and the text is not submitted.

The toxicity of written text is calculated from the detoxify python library.

## Steps to run demo

To run the demo first `detoxify` library has to be installed. This can be done using:

```bash
pip install detoxify
```

Then typing 
```bash
python run_task__local__inhouse.py
``` 

should run the demo.

## End-to-end example

Now let's see how the whole end-to-end list of commands looks like for the example `Toxicity Example`:

```shell
# 1. In your console

docker-compose -f docker/docker-compose.dev.yml up
docker exec -it mephisto_dc bash

# 2.Inside Docker container

# 2a. Install `detoxify` python library
pip install detoxify

# 2b. Run the Task
cd /mephisto/examples/remote_procedure/toxicity_detection
python ./run_task__local__inhouse.py
```
