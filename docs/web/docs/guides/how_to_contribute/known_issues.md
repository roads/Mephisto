---

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

sidebar_position: 6
---

# Known issues

While we strive to make Mephisto work its best, there are a few "perennial" issues to be aware of:

1. Sometimes Tasks consisting of only 1 Unit don't shut themselves down upon that Unit completion.
2. After restarting a Task numerous times within the same Docker container, 
remote procedures will eventually fail to respond and websockets will be automatically closed. 
(Reloading Task page will re-establish a socket and you will get the old responses, but the new page code won't have the context to process them)
