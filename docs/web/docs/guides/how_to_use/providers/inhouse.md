---

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

sidebar_position: 3
---

# In-House

In-House CrowdProvider allows running live Tasks with no third-party worker platform integration.


## Simple In-House authorization

> Note that this feature is enabled only for In-House provider.

To prevent unauthorized access to your Task, you can enable a simple authorization.
Providing a one-column CSV file with allowed Worker usernames will limit your target audience only to these specific workers.


### Enable CSV authorization

1. Create a CSV file with one column containing allowed Worker usernames
    1. Worker will need to use this username on Task's Welcome page
    2. Alternatively, you can include username in a Task URL as a parameter (that you will send to Worker to invite them to the Task)
2. Place this file in the data directory of your Task (e.g. `examples/static_react_task/data/authorization.csv`)
3. In your Task config, set `provider.authorization_csv` parameter to this file path
```yaml
mephisto:
  ...

  provider:
    authorization_csv: ${task_dir}/data/authorization.csv
    ...
```
4. Run your Task and try authorizing yourself with one of the allowed usernames from the CSV file.


## Example

To understand how it works, you can run an example Task from our [In-House authorization example](https://github.com/facebookresearch/Mephisto/blob/main/examples/static_react_task/run_task_with_authorization__local__inhouse.py).
