import bindAll from "lodash.bindall";
import PropTypes from "prop-types";
import React from "react";
import { injectIntl, intlShape, defineMessages } from "react-intl";
import VM from "scratch-vm";
import goaicostume1 from "!!raw-loader!../lib/default-project/goai-neutral1.svg";
import goaicostume2 from "!!raw-loader!../lib/default-project/goai-neutral2.svg";
import goaicostume3 from "!!raw-loader!../lib/default-project/goai-joyful.svg";
import goaicostume4 from "!!raw-loader!../lib/default-project/goai-concerned1.svg";
import goaicostume5 from "!!raw-loader!../lib/default-project/goai-concerned2.svg";
import goaicostume6 from "!!raw-loader!../lib/default-project/goai-sad1.svg";
import goaicostume7 from "!!raw-loader!../lib/default-project/goai-sad2.svg";

import spriteLibraryContent from "../lib/libraries/sprites.json";
import randomizeSpritePosition from "../lib/randomize-sprite-position";
import spriteTags from "../lib/libraries/sprite-tags";

import LibraryComponent from "../components/library/library.jsx";

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: "Choose a Sprite",
        description: "Heading for the sprite library",
        id: "gui.spriteLibrary.chooseASprite",
    },
});

class SpriteLibrary extends React.PureComponent {
    constructor(props) {
        super(props);
        bindAll(this, ["handleItemSelect"]);

        let _TextEncoder;
        if (typeof TextEncoder === "undefined") {
            _TextEncoder = require("text-encoding").TextEncoder;
        } else {
            /* global TextEncoder */
            _TextEncoder = TextEncoder;
        }
        const encoder = new _TextEncoder();

        const exists = spriteLibraryContent.some((p) => p.name === "GoAI");

        if (!exists) {
            spriteLibraryContent.push({
                name: "GoAI",
                tags: [
                    "sports",
                    "basketball",
                    "people",
                    "wheelchair",
                    "handicap",
                    "handicapable",
                    "alex eben meyer",
                ],
                isStage: false,
                variables: {},
                costumes: [
                    {
                        assetId: "b7853f557e4426412e64bb3da6531a99",
                        name: "goaicostume1",
                        bitmapResolution: 1,
                        md5ext: `data:image/svg+xml;base64,${encoder
                            .encode(goaicostume1)
                            .toBase64()}`,
                        dataFormat: "svg",
                        rotationCenterX: 128,
                        rotationCenterY: 145,
                    },
                    {
                        assetId: "e6ddc55a6ddd9cc9d84fe0b4c21e016f",
                        name: "goaicostume2",
                        bitmapResolution: 1,
                        md5ext: `data:image/svg+xml;base64,${encoder
                            .encode(goaicostume2)
                            .toBase64()}`,
                        dataFormat: "svg",
                        rotationCenterX: 128,
                        rotationCenterY: 145,
                    },
                    {
                        assetId: "f60f99278455c843b7833fb7615428dd",
                        name: "goaicostume3",
                        bitmapResolution: 1,
                        md5ext: `data:image/svg+xml;base64,${encoder
                            .encode(goaicostume3)
                            .toBase64()}`,
                        dataFormat: "svg",
                        rotationCenterX: 128,
                        rotationCenterY: 145,
                    },
                    {
                        assetId: "b2f75ac1cd84615efaea6a7d7a4ee205",
                        name: "goaicostume4",
                        bitmapResolution: 1,
                        md5ext: `data:image/svg+xml;base64,${encoder
                            .encode(goaicostume4)
                            .toBase64()}`,
                        dataFormat: "svg",
                        rotationCenterX: 128,
                        rotationCenterY: 145,
                    },
                    {
                        assetId: "580fba92f23d5592200eb5a9079dc38f",
                        name: "goaicostume5",
                        bitmapResolution: 1,
                        md5ext: `data:image/svg+xml;base64,${encoder
                            .encode(goaicostume5)
                            .toBase64()}`,
                        dataFormat: "svg",
                        rotationCenterX: 128,
                        rotationCenterY: 145,
                    },
                    {
                        assetId: "e51942bb4651e616549cfce1ad36ff83",
                        name: "goaicostume6",
                        bitmapResolution: 1,
                        md5ext: `data:image/svg+xml;base64,${encoder
                            .encode(goaicostume6)
                            .toBase64()}`,
                        dataFormat: "svg",
                        rotationCenterX: 128,
                        rotationCenterY: 145,
                    },
                    {
                        assetId: "8313a2229d555bbdb8ce92dffed067ad",
                        name: "goaicostume7",
                        bitmapResolution: 1,
                        md5ext: `data:image/svg+xml;base64,${encoder
                            .encode(goaicostume7)
                            .toBase64()}`,
                        dataFormat: "svg",
                        rotationCenterX: 128,
                        rotationCenterY: 145,
                    },
                ],
                sounds: [
                    {
                        assetId: "1727f65b5f22d151685b8e5917456a60",
                        name: "Basketball Bounce",
                        dataFormat: "wav",
                        format: "adpcm",
                        rate: 22050,
                        sampleCount: 8129,
                        md5ext: "1727f65b5f22d151685b8e5917456a60.wav",
                    },
                ],
                blocks: {},
            });
            spriteLibraryContent.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
        }
    }
    handleItemSelect(item) {
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item)).then(() => {
            this.props.onActivateBlocksTab();
        });
    }
    render() {
        return (
            <LibraryComponent
                data={spriteLibraryContent}
                id="spriteLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

SpriteLibrary.propTypes = {
    intl: intlShape.isRequired,
    onActivateBlocksTab: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired,
};

export default injectIntl(SpriteLibrary);
