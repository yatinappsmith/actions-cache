# cache

These actions allow caching dependencies and build outputs to eliminate duplicate work and improve workflow execution time. **The main advantage of this fork over the base is sharing data across multiple jobs.** You do not need to use artifacts and can skip various steps, saving as much runtime as possible.

The following actions are available:

- `martijnhols/actions-cache@v3`
- `martijnhols/actions-cache/restore@v3`
- `martijnhols/actions-cache/save@v3`
- `martijnhols/actions-cache/check@v3`

While this is a fork, there are currently no plans to merge this into GitHub's [actions/cache](https://github.com/actions/cache) since GitHub does not appear to be reviewing [P](https://github.com/actions/cache/pull/466)[R](https://github.com/actions/cache/pull/474)[s](https://github.com/actions/toolkit/pull/659) and so making this mergeable would be a waste of time. This repository will be available on its own.

- [Action documentation](#actions)
- [Recipes](#recipes)

## Actions

### martijnhols/actions-cache

This is the base action largely matching GitHub's [actions/cache](https://github.com/actions/cache). Under the hood this calls the `restore` action where you place the action, and the `save` action just before the job finishes.

This can be used for caching a step such as installing dependencies which are not re-used in other jobs. If you want to reuse your data in other jobs, use one of the other actions.

#### Inputs

* `path` - **Required** - A list of files, directories, and wildcard patterns to cache and restore. See [`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob) for supported patterns. 
* `key` - **Required** - An explicit key for restoring and saving the cache
* `restore-keys` - An ordered list of keys to use for restoring the cache if no cache hit occurred for key
* `upload-chunk-size` - The chunk size used to split up large files during upload, in bytes

#### Outputs

* `cache-hit` - A boolean value to indicate an exact match was found for the key
* `primary-key` - The primary key for restoring or saving exactly matching cache.

> See [Skipping steps based on cache-hit](#Skipping-steps-based-on-cache-hit) for info on using this output

### martijnhols/actions-cache/restore

This action will read data from the cache and place it in at the provided path.

#### Inputs

* `path` - **Required** - A list of files, directories, and wildcard patterns to cache and restore. See [`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob) for supported patterns. 
* `key` - **Required** - An explicit key for restoring and saving the cache
* `restore-keys` - An ordered list of keys to use for restoring the cache if no cache hit occurred for key
* `required` - When set to `true`, the action will fail if an exact match could not be found.

#### Outputs

* `cache-hit` - A boolean value to indicate an exact match was found for the key
* `primary-key` - The primary key for restoring or saving exactly matching cache.

### martijnhols/actions-cache/save

This action will save data at the provided path to the cache.

#### Inputs

* `path` - **Required** - A list of files, directories, and wildcard patterns to cache and restore. See [`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob) for supported patterns. 
* `key` - **Required** - An explicit key for restoring and saving the cache
* `upload-chunk-size` - The chunk size used to split up large files during upload, in bytes

Tip: when combined with the `restore` or `check` action, add the `id: cache` property to the `restore`/`check` action and use `key: ${{ steps.cache.outputs.primary-key }}` in the `save` action. This ensures your cache key is not recomputed, which may otherwise lead to issues.

### martijnhols/actions-cache/check

This action will check if an exact match is available in the cache without downloading it.

#### Inputs

* `path` - **Required** - A list of files, directories, and wildcard patterns to cache and restore. See [`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob) for supported patterns. 
* `key` - **Required** - An explicit key for restoring and saving the cache

#### Outputs

* `cache-hit` - A boolean value to indicate an exact match was found for the key
* `primary-key` - The primary key for restoring or saving exactly matching cache.

## Recipes

These recipes serve as examples. For simplicity sake some irrelevant steps (such as setup-node) are omitted.

<details id="just-caching">
<summary><a href="#just-caching">🔗</a> Just caching</summary>

This caches `node_modules` folder. Using the [Skipping steps based on cache-hit](#skipping-steps-based-on-cache-hit) solution, this only installs dependencies if the cache did not return an exact match.

If no exact match could be found, it uses a *restore-key* to restore an older cache since the tool we use (yarn) can reuse existing files to save time.

```yaml
name: Build app

on: push

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Cache node_modules
      id: cache
      uses: martijnhols/actions-cache@v3
      with:
        # Cache the node_modules folder and its contents
        path: node_modules
        # Genarate a unique key based on the runner OS, an id, and a hash that changes whenever the `yarn.lock` file or any file in the `patches` folder changes.
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        # If no exact match is found, look for the most recent cache entry with this key:
        restore-keys: ${{ runner.os }}-node_modules

    - name: Install dependencies
      # Only install dependencies only when no exact match was found in the cache
      if: steps.cache.outputs.cache-hit != 'true'
      run: yarn install

    - name: Build app
      run: yarn build
```
</details>

<details id="just-caching-manual">
<summary><a href="#just-caching-manual">🔗</a> Just caching with manual control</summary>

This behaves the same as the [Just caching](#just-caching) recipe, but uses the `restore` and `save` actions manually. This has no significant benefits over using the standard action, though I prefer it for its minor readability and maintainability improvements.

```yaml
name: Build app

on: push

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Restore "node_modules" from cache
      id: cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        restore-keys: ${{ runner.os }}-node_modules

    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: yarn install

    - name: Build app
      run: yarn build

    - name: Save "node_modules" to cache
      # No need to save identical data when an exact match was found
      if: steps.cache.outputs.cache-hit != 'true'
      uses: martijnhols/actions-cache/save@v3
      with:
        path: node_modules
        # Re-use the primary-key from the restore action to ensure it is not recomputed. This could otherwise cause issues if our "build" step modifies files within one of the `hashFiles` directories.
        key: ${{ steps.cache.outputs.primary-key }}
```
</details>

<details id="share-cache">
<summary><a href="#share-cache">🔗</a> Share cache across jobs</summary>

This extends the [Just caching with manual control](#just-caching-manual) recipe.

When your workflow grows and you add more checks, you will want to split up your jobs. Using the cache you can share dependencies across multiple jobs efficiently.

This moves the `install` step to its own job and restores dependencies from cache when it gets time to build the app. The cache can be restored in multiple jobs simultaneously.

```yaml
name: Build app

on: push

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "node_modules" from cache
      id: cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        restore-keys: ${{ runner.os }}-node_modules

    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: yarn install

    - name: Save "node_modules" to cache
      if: steps.cache.outputs.cache-hit != 'true'
      uses: martijnhols/actions-cache/save@v3
      with:
        path: node_modules
        key: ${{ steps.cache.outputs.primary-key }}

  build:
    needs: [install]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "node_modules" from cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        # Fail when the cache could not be found (this should never happen unless you have a misconfiguration)
        required: true

    - name: Build app
      run: yarn build
```
</details>

<details id="cache-build">
<summary><a href="#cache-build">🔗</a> Cache build output and skipping build</summary>

This extends the [Share cache across jobs](#share-cache) recipe.

When you want to publish your build, you probably want to do this in a separate step. Using the [Share cache across jobs](#share-cache) recipe you can also reuse your build (we add this in step 1).

As a bonus, you can skip building the app entirely if an exact match was found (we add this in step 2). This is especially useful in monorepos, where only a few apps need to be build each run.

**NOTE:** Take extra care when choosing a cache key. Builds often involve many different configuration files, if you forget to add a file it may not trigger a rebuild when it is changed.

**Step 1/2: First, let's add a publish job**

```yaml
name: Build app

on: push

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "node_modules" from cache
      id: cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        restore-keys: ${{ runner.os }}-node_modules

    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: yarn install

    - name: Save "node_modules" to cache
      if: steps.cache.outputs.cache-hit != 'true'
      uses: martijnhols/actions-cache/save@v3
      with:
        path: node_modules
        key: ${{ steps.cache.outputs.primary-key }}

  build:
    needs: [install]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "node_modules" from cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        required: true

    - name: Build app
      run: yarn build

    # Notice that we do not use a "restore" in this job: the build in our imaginary project can't reuse its own build files so restoring that before building would be a waste of time.
    - name: Save "build" to cache
      uses: martijnhols/actions-cache/save@v3
      with:
        path: build
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches', 'src', '.babelrc') }}

  publish:
    needs: [install]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "build" from cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: build
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches', 'src', '.babelrc') }}
        required: true

    - name: Publish app
      run: yarn publish
```

**Step 2/2: Now we use `check` to skip steps if the app was already built**

(This only changes made in this yml are in the `build` job)

```yaml
name: Build app

on: push

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "node_modules" from cache
      id: cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        restore-keys: ${{ runner.os }}-node_modules

    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: yarn install

    - name: Save "node_modules" to cache
      if: steps.cache.outputs.cache-hit != 'true'
      uses: martijnhols/actions-cache/save@v3
      with:
        path: node_modules
        key: ${{ steps.cache.outputs.primary-key }}

  build:
    needs: [install]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    # Using martijnhols/actions-cache/check we check if a cache entry exists without downloading it
    - name: Check if "build" is already cached
      uses: martijnhols/actions-cache/check@v3
      id: cache
      with:
        path: build
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches', 'src', '.babelrc') }}

    - name: Restore "node_modules" from cache
      # Only execute if the build isn't already in cache
      if: steps.cache.outputs.cache-hit != 'true'
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        required: true

    - name: Build app
      # Only execute if the build isn't already in cache
      if: steps.cache.outputs.cache-hit != 'true'
      run: yarn build

    # Notice that we do not use a "restore" in this job: the build in our imaginary project can't reuse its own build files so restoring that before building would be a waste of time.
    - name: Save "build" to cache
      # Only execute if the build isn't already in cache
      if: steps.cache.outputs.cache-hit != 'true'
      uses: martijnhols/actions-cache/save@v3
      with:
        path: build
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches', 'src', '.babelrc') }}

  publish:
    needs: [install]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "build" from cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: build
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches', 'src', '.babelrc') }}
        required: true

    - name: Publish app
      run: yarn publish
```
</details>

<details id="save-regardless-of-failure">
<summary><a href="#save-regardless-of-failure">🔗</a> Save cache regardless of job success/failure</summary>

This extends the [Just caching](#just-caching) recipe.

When you have multiple build steps in a single job, you may want to save your data regardless of the job failing. In this case splitting up the cache actions like in the [Just caching with manual control](#just-caching-manual) recipe and moving the save action above your flaky build step achieves this.

If you want your cache to be saved regardless of a failure during the install step, you can change the `if: steps.cache.outputs.cache-hit != 'true'` line into `if: always() && steps.cache.outputs.cache-hit != 'true'`.

```yaml
name: Build app

on: push

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Restore "node_modules" from cache
      id: cache
      uses: martijnhols/actions-cache/restore@v3
      with:
        path: node_modules
        key: ${{ runner.os }}-node_modules-${{ hashFiles('yarn.lock', 'patches') }}
        restore-keys: ${{ runner.os }}-node_modules

    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: yarn install

    - name: Save "node_modules" to cache
      if: steps.cache.outputs.cache-hit != 'true'
      uses: martijnhols/actions-cache/save@v3
      with:
        path: node_modules
        key: ${{ steps.cache.outputs.primary-key }}

    - name: Run flaky tests
      run: yarn test
```
</details>

## Creating a cache key

A cache key can include any of the contexts, functions, literals, and operators supported by GitHub Actions.

For example, using the [`hashFiles`](https://help.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#hashfiles) function allows you to create a new cache when dependencies change.

```yaml
  - uses: actions/cache@v2
    with:
      path: | 
        path/to/dependencies
        some/other/dependencies 
      key: ${{ runner.os }}-${{ hashFiles('**/lockfiles') }}
```

Additionally, you can use arbitrary command output in a cache key, such as a date or software version:

```yaml
  # http://man7.org/linux/man-pages/man1/date.1.html
  - name: Get Date
    id: get-date
    run: |
      echo "::set-output name=date::$(/bin/date -u "+%Y%m%d")"
    shell: bash

  - uses: actions/cache@v2
    with:
      path: path/to/dependencies
      key: ${{ runner.os }}-${{ steps.get-date.outputs.date }}-${{ hashFiles('**/lockfiles') }}
```

See [Using contexts to create cache keys](https://help.github.com/en/actions/configuring-and-managing-workflows/caching-dependencies-to-speed-up-workflows#using-contexts-to-create-cache-keys)

## Cache Limits

A repository can have up to 5GB of caches. Once the 5GB limit is reached, older caches will be evicted based on when the cache was last accessed. Caches that are not accessed within the last week will also be evicted.

> I have personally never encountered issues with cache being evicted. If the total cache used in your workflows approaches the 5GB limit I recommend reconsidering using cache for sharing data across jobs.

## Skipping steps based on cache-hit

Using the `cache-hit` output, subsequent steps (such as install or build) can be skipped when a cache hit occurs on the key.

Example:
```yaml
steps:
  - uses: actions/checkout@v2

  - uses: actions/cache@v2
    id: cache
    with:
      path: path/to/dependencies
      key: ${{ runner.os }}-${{ hashFiles('**/lockfiles') }}

  - name: Install Dependencies
    if: steps.cache.outputs.cache-hit != 'true'
    run: /install.sh
```

> Note: The `id` defined in `actions/cache` must match the `id` in the `if` statement (i.e. `steps.[ID].outputs.cache-hit`)

## License
The scripts and documentation in this project are released under the [MIT License](LICENSE)
