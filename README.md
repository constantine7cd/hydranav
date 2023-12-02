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

As for now, extension supports "go to definition" for symbols such as: 
 - class
 - function
 - method of the class (staticmethod or classmethod)
 - any global variable defined inside .py script

In the case nothing found, the extension tries to find either the parent script of the symbol or ```__init__.py``` of the parent folder. 

## Extension Settings

Coming soon...

## Known Issues

Search inside commented code. In the case code contains comments of type ```"""python comment"""``` and the symbol (class, function or variable) is mentioned inside that comment, and that comment is before symbol definition (or symbol does not exist) than the extension navigates symbol inside comment. *Note!* Extension works as expected with comments of type ```# comment```.

## Release Notes

### 0.1.0

Initial release of hydranavi extension. 

---
