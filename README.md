# hydranav 

This extension simplifies navigation inside [Hydra](https://hydra.cc) configuration files (.yaml supported only). 

## Features

The main feature is the "Go to definition" option in case you specify `_target_` inside your config. Suppose, your hydra configuration file has the following structure:

```yml
_target_: src.models.megamodels.MegaNet 
size: huge
```

This configuration file follows hydra syntax `_taget_` which is path to python object. In this case file `src/models/megamodels.py` contains class `MegaNet`. You may easily navigate to the definition of that class by simply do `Cmd+click` on MacOS or `Ctrl+click` on Linux and Windows. 

You may also extend the functionality of hydra package by adding own handlers. For instance, you may add handler `^{config_parent_dir:path_to_config_relative_to_parent.yaml}` which able to parse another .yaml configuration:

```yml
_target_: src.datasets.MyMegaDataset
dataset_config: ^{config:datasets/mega.yaml}
```

The `config` is a parent directory of config `datasets/mega.yaml`. The extension searches for `config` directory inside the project, and joins with `datasets/mega.yaml`, and navigates to that file. 

**NOTE!** You may use any syntax for your hydra handler: `^{}`, `cfg_parse{}`, etc., the only internal syntax `config_parent_dir:path_to_config_relative_to_parent.yaml` matters.

## Extension Settings

Coming soon...

## Known Issues

Coming soon...

## Release Notes

### 0.1.0

Initial release of hydranavi extension. 

---
