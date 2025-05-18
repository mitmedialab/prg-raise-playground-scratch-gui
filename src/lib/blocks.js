import { overridesForCustomArgumentSupport } from './prg/customBlockOverrides';

/**
 * Connect scratch blocks with the vm
 * @param {VirtualMachine} vm - The scratch vm
 * @param {Bool} useCatBlocks - Whether to use cat blocks rendering of ScratchBlocks
 * @return {ScratchBlocks} ScratchBlocks connected with the vm
 */
export default function (vm, useCatBlocks) {
    const Blockly = useCatBlocks ? require('cat-blocks') : require('blockly');
    const jsonForMenuBlock = function (name, menuOptionsFn, category, start) {
        return {
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown',
                    name: name,
                    options: function () {
                        return start.concat(menuOptionsFn());
                    }
                }
            ],
            inputsInline: true,
            output: "String",
            outputShape: Blockly.OUTPUT_SHAPE_ROUND,
            extensions: [`colours_${category}`],
        };
    };

    const jsonForHatBlockMenu = function (hatName, name, menuOptionsFn, category, start) {
        return {
            message0: hatName,
            args0: [
                {
                    type: 'field_dropdown',
                    name: name,
                    options: function () {
                        return start.concat(menuOptionsFn());
                    }
                }
            ],
            extensions: [`colours_${category}`, "shape_hat"],
        };
    };


    const jsonForSensingMenus = function (menuOptionsFn) {
        return {
            message0: Blockly.Msg['SENSING_OF'],
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'PROPERTY',
                    options: function () {
                        return menuOptionsFn();
                    }

                },
                {
                    type: 'input_value',
                    name: 'OBJECT'
                }
            ],
            output: true,
            outputShape: Blockly.OUTPUT_SHAPE_ROUND,
            extensions: ["colours_sensing"],
        };
    };

    const soundsMenu = function () {
        let menu = [['', '']];
        if (vm.editingTarget && vm.editingTarget.sprite.sounds.length > 0) {
            menu = vm.editingTarget.sprite.sounds.map(sound => [sound.name, sound.name]);
        }
        menu.push([
            Blockly.Msg['SOUND_RECORD'],
            'SOUND_RECORD'
        ]);
        return menu;
    };

    const costumesMenu = function () {
        if (vm.editingTarget && vm.editingTarget.getCostumes().length > 0) {
            return vm.editingTarget.getCostumes().map(costume => [costume.name, costume.name]);
        }
        return [['', '']];
    };

    const backdropsMenu = function () {
        const next = Blockly.Msg['LOOKS_NEXTBACKDROP'];
        const previous = Blockly.Msg['LOOKS_PREVIOUSBACKDROP'];
        const random = Blockly.Msg['LOOKS_RANDOMBACKDROP'];
        if (vm.runtime.targets[0] && vm.runtime.targets[0].getCostumes().length > 0) {
            return vm.runtime.targets[0].getCostumes().map(costume => [costume.name, costume.name])
                .concat([[next, 'next backdrop'],
                [previous, 'previous backdrop'],
                [random, 'random backdrop']]);
        }
        return [['', '']];
    };

    const backdropNamesMenu = function () {
        const stage = vm.runtime.getTargetForStage();
        if (stage && stage.getCostumes().length > 0) {
            return stage.getCostumes().map(costume => [costume.name, costume.name]);
        }
        return [['', '']];
    };

    const spriteMenu = function () {
        const sprites = [];
        for (const targetId in vm.runtime.targets) {
            if (!Object.prototype.hasOwnProperty.call(vm.runtime.targets, targetId)) continue;
            if (vm.runtime.targets[targetId].isOriginal) {
                if (!vm.runtime.targets[targetId].isStage) {
                    if (vm.runtime.targets[targetId] === vm.editingTarget) {
                        continue;
                    }
                    sprites.push([vm.runtime.targets[targetId].sprite.name, vm.runtime.targets[targetId].sprite.name]);
                }
            }
        }
        return sprites;
    };

    const cloneMenu = function () {
        if (vm.editingTarget && vm.editingTarget.isStage) {
            const menu = spriteMenu();
            if (menu.length === 0) {
                return [['', '']]; // Empty menu matches Scratch 2 behavior
            }
            return menu;
        }
        const myself = Blockly.Msg['CONTROL_CREATECLONEOF_MYSELF'];
        return [[myself, '_myself_']].concat(spriteMenu());
    };

    Blockly.Blocks.sound_sounds_menu.init = function () {
        const json = jsonForMenuBlock('SOUND_MENU', soundsMenu, "sounds", []);
        this.jsonInit(json);
        this.getField("SOUND_MENU").setValidator((newValue) => {
            if (newValue === "SOUND_RECORD") {
                Blockly.recordSoundCallback();
                return null;
            }
            return newValue;
        });
    };

    Blockly.Blocks.looks_costume.init = function () {
        const json = jsonForMenuBlock('COSTUME', costumesMenu, "looks", []);
        this.jsonInit(json);
    };

    Blockly.Blocks.looks_backdrops.init = function () {
        const json = jsonForMenuBlock('BACKDROP', backdropsMenu, "looks", []);
        this.jsonInit(json);
    };

    Blockly.Blocks.event_whenbackdropswitchesto.init = function () {
        const json = jsonForHatBlockMenu(
            Blockly.Msg['EVENT_WHENBACKDROPSWITCHESTO'],
            'BACKDROP', backdropNamesMenu, "event", []);
        this.jsonInit(json);
    };

    Blockly.Blocks.motion_pointtowards_menu.init = function () {
        const mouse = Blockly.Msg['MOTION_POINTTOWARDS_POINTER'];
        const json = jsonForMenuBlock('TOWARDS', spriteMenu, "motion", [
            [mouse, '_mouse_']
        ]);
        this.jsonInit(json);
    };

    Blockly.Blocks.motion_goto_menu.init = function () {
        const random = Blockly.Msg['MOTION_GOTO_RANDOM'];
        const mouse = Blockly.Msg['MOTION_GOTO_POINTER'];
        const json = jsonForMenuBlock('TO', spriteMenu, "motion", [
            [random, '_random_'],
            [mouse, '_mouse_']
        ]);
        this.jsonInit(json);
    };

    Blockly.Blocks.motion_glideto_menu.init = function () {
        const random = Blockly.Msg['MOTION_GLIDETO_RANDOM'];
        const mouse = Blockly.Msg['MOTION_GLIDETO_POINTER'];
        const json = jsonForMenuBlock('TO', spriteMenu, "motion", [
            [random, '_random_'],
            [mouse, '_mouse_']
        ]);
        this.jsonInit(json);
    };

    Blockly.Blocks.sensing_of_object_menu.init = function () {
        const stage = Blockly.Msg['SENSING_OF_STAGE'];
        const json = jsonForMenuBlock('OBJECT', spriteMenu, "sensing", [
            [stage, '_stage_']
        ]);
        this.jsonInit(json);
    };

    Blockly.Blocks.sensing_of.init = function () {
        const blockId = this.id;
        const blockType = this.type;

        // Get the sensing_of block from vm.
        let defaultSensingOfBlock;
        const blocks = vm.runtime.flyoutBlocks._blocks;
        Object.keys(blocks).forEach(id => {
            const block = blocks[id];
            if (id === blockType || (block && block.opcode === blockType)) {
                defaultSensingOfBlock = block;
            }
        });

        // Function that fills in menu for the first input in the sensing block.
        // Called every time it opens since it depends on the values in the other block input.
        const menuFn = function () {
            const stageOptions = [
                [Blockly.Msg.SENSING_OF_BACKDROPNUMBER, 'backdrop #'],
                [Blockly.Msg.SENSING_OF_BACKDROPNAME, 'backdrop name'],
                [Blockly.Msg.SENSING_OF_VOLUME, 'volume']
            ];
            const spriteOptions = [
                [Blockly.Msg.SENSING_OF_XPOSITION, 'x position'],
                [Blockly.Msg.SENSING_OF_YPOSITION, 'y position'],
                [Blockly.Msg.SENSING_OF_DIRECTION, 'direction'],
                [Blockly.Msg.SENSING_OF_COSTUMENUMBER, 'costume #'],
                [Blockly.Msg.SENSING_OF_COSTUMENAME, 'costume name'],
                [Blockly.Msg.SENSING_OF_SIZE, 'size'],
                [Blockly.Msg.SENSING_OF_VOLUME, 'volume']
            ];
            if (vm.editingTarget) {
                let lookupBlocks = vm.editingTarget.blocks;
                let sensingOfBlock = lookupBlocks.getBlock(blockId);

                // The block doesn't exist, but should be in the flyout. Look there.
                if (!sensingOfBlock) {
                    sensingOfBlock = vm.runtime.flyoutBlocks.getBlock(blockId) || defaultSensingOfBlock;
                    // If we still don't have a block, just return an empty list . This happens during
                    // scratch blocks construction.
                    if (!sensingOfBlock) {
                        return [['', '']];
                    }
                    // The block was in the flyout so look up future block info there.
                    lookupBlocks = vm.runtime.flyoutBlocks;
                }
                const sort = function (options) {
                    options.sort(Blockly.scratchBlocksUtils.compareStrings);
                };
                // Get all the stage variables (no lists) so we can add them to menu when the stage is selected.
                const stageVariableOptions = vm.runtime.getTargetForStage().getAllVariableNamesInScopeByType('');
                sort(stageVariableOptions);
                const stageVariableMenuItems = stageVariableOptions.map(variable => [variable, variable]);
                if (sensingOfBlock.inputs.OBJECT.shadow !== sensingOfBlock.inputs.OBJECT.block) {
                    // There's a block dropped on top of the menu. It'd be nice to evaluate it and
                    // return the correct list, but that is tricky. Scratch2 just returns stage options
                    // so just do that here too.
                    return stageOptions.concat(stageVariableMenuItems);
                }
                const menuBlock = lookupBlocks.getBlock(sensingOfBlock.inputs.OBJECT.shadow);
                const selectedItem = menuBlock.fields.OBJECT.value;
                if (selectedItem === '_stage_') {
                    return stageOptions.concat(stageVariableMenuItems);
                }
                // Get all the local variables (no lists) and add them to the menu.
                const target = vm.runtime.getSpriteTargetByName(selectedItem);
                let spriteVariableOptions = [];
                // The target should exist, but there are ways for it not to (e.g. #4203).
                if (target) {
                    spriteVariableOptions = target.getAllVariableNamesInScopeByType('', true);
                    sort(spriteVariableOptions);
                }
                const spriteVariableMenuItems = spriteVariableOptions.map(variable => [variable, variable]);
                return spriteOptions.concat(spriteVariableMenuItems);
            }
            return [['', '']];
        };

        const json = jsonForSensingMenus(menuFn);
        this.jsonInit(json);
    };

    Blockly.Blocks.sensing_distancetomenu.init = function () {
        const mouse = Blockly.Msg['SENSING_DISTANCETO_POINTER'];
        const json = jsonForMenuBlock('DISTANCETOMENU', spriteMenu, "sensing", [
            [mouse, '_mouse_']
        ]);
        this.jsonInit(json);
    };

    Blockly.Blocks.sensing_touchingobjectmenu.init = function () {
        const mouse = Blockly.Msg['SENSING_TOUCHINGOBJECT_POINTER'];
        const edge = Blockly.Msg['SENSING_TOUCHINGOBJECT_EDGE'];
        const json = jsonForMenuBlock('TOUCHINGOBJECTMENU', spriteMenu, "sensing", [
            [mouse, '_mouse_'],
            [edge, '_edge_']
        ]);
        this.jsonInit(json);
    };

    Blockly.Blocks.control_create_clone_of_menu.init = function () {
        const json = jsonForMenuBlock('CLONE_OPTION', cloneMenu, "control", []);
        this.jsonInit(json);
    };

    Blockly.CheckableContinuousFlyout.prototype.getCheckboxState = function (blockId) {
        const monitoredBlock = vm.runtime.monitorBlocks._blocks[blockId];
        return monitoredBlock ? monitoredBlock.isMonitored : false;
    };

    // ScratchBlocks.FlyoutExtensionCategoryHeader.getExtensionState = function (extensionId) {
    //     if (vm.getPeripheralIsConnected(extensionId)) {
    //         return ScratchBlocks.StatusButtonState.READY;
    //     }
    //     return ScratchBlocks.StatusButtonState.NOT_READY;
    // };

    // ScratchBlocks.FieldNote.playNote_ = function (noteNum, extensionId) {
    //     vm.runtime.emit('PLAY_NOTE', noteNum, extensionId);
    // };

    // Use a collator's compare instead of localeCompare which internally
    // creates a collator. Using this is a lot faster in browsers that create a
    // collator for every localeCompare call.
    const collator = new Intl.Collator([], {
        sensitivity: 'base',
        numeric: true
    });
    // ScratchBlocks.scratchBlocksUtils.compareStrings = function (str1, str2) {
    //     return collator.compare(str1, str2);
    // };

    // Blocks wants to know if 3D CSS transforms are supported. The cross
    // section of browsers Scratch supports and browsers that support 3D CSS
    // transforms will make the return always true.
    //
    // Shortcutting to true lets us skip an expensive style recalculation when
    // first loading the Scratch editor.
    Blockly.utils.is3dSupported = function () {
        return true;
    };

    overridesForCustomArgumentSupport(Blockly, vm);
    return Blockly;
}
