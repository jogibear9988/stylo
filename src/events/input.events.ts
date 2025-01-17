import {getSelection, moveCursorToEnd} from '@deckdeckgo/utils';
import configStore from '../stores/config.store';
import containerStore from '../stores/container.store';
import {elementIndex, findNodeAtDepths, toHTMLElement} from '../utils/node.utils';
import {createNewParagraph, findParagraph, isStartNode} from '../utils/paragraph.utils';
import {
  BeforeInputKey,
  beforeInputTransformer,
  transformInput,
  TransformInput
} from '../utils/transform.utils';

export class InputEvents {
  private lastBeforeInput: BeforeInputKey | undefined = undefined;

  init() {
    containerStore.state.ref?.addEventListener('beforeinput', this.onBeforeInput);
  }

  destroy() {
    containerStore.state.ref?.removeEventListener('beforeinput', this.onBeforeInput);
  }

  private onBeforeInput = async ($event: InputEvent) => {
    await this.preventTextLeaves($event);

    this.deleteContentBackward($event);

    await this.transformInput($event);
  };

  private async preventTextLeaves($event: InputEvent) {
    const anchorNode: Node | undefined | null = getSelection()?.anchorNode;

    if (!containerStore.state.ref.isEqualNode(anchorNode)) {
      return;
    }

    const range: Range | undefined | null = getSelection()?.getRangeAt(0);

    if (!range) {
      return;
    }

    const {data} = $event;

    // User is not typing, for example an image is moved
    if (data === null) {
      return;
    }

    const {startOffset} = range;

    const target: Node | undefined = findNodeAtDepths({
      parent: containerStore.state.ref,
      indexDepths: [startOffset]
    });

    // We create a div - i.e. new HTML element - only if the actual target an editable paragraph that accepts text
    if (configStore.state.textParagraphs?.includes(target?.nodeName.toLowerCase())) {
      return;
    }

    // User is typing text at the root of the container therefore the browser will create a text node a direct descendant of the contenteditable
    // This can happen when user types for example before or after an image

    $event.preventDefault();

    const div: Node | undefined = await createNewParagraph({
      container: containerStore.state.ref,
      range,
      text: data
    });

    moveCursorToEnd(div);
  }

  private deleteContentBackward($event: InputEvent) {
    const {inputType} = $event;

    if (!['deleteContentBackward'].includes(inputType)) {
      return;
    }

    const range: Range | undefined | null = getSelection()?.getRangeAt(0);

    // If the commonAncestorContainer is the container then we have selected multiple paragraphs
    if (!containerStore.state.ref.isEqualNode(range?.commonAncestorContainer)) {
      return;
    }

    // If first char is a zeroWidthSpace and the offset start at the second character, reset range to begin
    const zeroWidthSpace: boolean =
      range.startOffset === 1 && range.startContainer.textContent.charAt(0) === '\u200B';
    if (zeroWidthSpace) {
      range.setStart(range.startContainer, 0);
    }

    // We don't have a selection that starts at the beginning of an element and paragraph
    if (range.startOffset > 0) {
      return;
    }

    // We don't have a selection that starts at the beginning of a paragraph
    if (!isStartNode({element: range.startContainer, container: containerStore.state.ref})) {
      return;
    }

    const paragraph: HTMLElement | undefined = toHTMLElement(
      findParagraph({element: range.startContainer, container: containerStore.state.ref})
    );

    if (!paragraph) {
      return;
    }

    // Reset range to begin of the paragraph in case it contains children
    const index: number = elementIndex(paragraph);
    range.setStart(containerStore.state.ref, index);

    $event.preventDefault();

    range.deleteContents();
  }

  private async transformInput($event: InputEvent) {
    const {data} = $event;

    const transformer: TransformInput | undefined = beforeInputTransformer.find(
      ({match}: TransformInput) => match({key: {key: data}, lastKey: this.lastBeforeInput})
    );

    if (transformer !== undefined) {
      await transformInput({$event, transformInput: transformer});

      await transformer.postTransform?.();

      this.lastBeforeInput = undefined;
      return;
    }

    this.lastBeforeInput = {key: data};
  }
}
