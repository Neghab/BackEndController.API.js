export const padId = (input, paddedLength = 8, paddingChar = 0) => {
    if(input && (paddedLength > 0)) {
        let inputString = input.toString().split('');
        const paddingCharAsString = paddingChar.toString();
        while (inputString.length < paddedLength) {
            inputString.unshift(paddingCharAsString);
        }
        const paddedString = inputString.join('');
        return paddedString;
    }else{
        return null;
    }
}