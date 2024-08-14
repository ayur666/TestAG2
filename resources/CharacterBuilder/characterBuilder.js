document.addEventListener('DOMContentLoaded', function() {
    const addModifierBtn = document.getElementById('add-modifier');
    const modifierList = document.getElementById('modifier-list');
    const skillNameInput = document.getElementById('skill-name');
    const skillDescriptionInput = document.getElementById('skill-description');
    const resourceTypeSelect = document.getElementById('resource-type');
    const outputName = document.getElementById('output-name');
    const outputDescription = document.getElementById('output-description');
    const outputResource = document.getElementById('output-resource');
    const outputModifiers = document.getElementById('output-modifiers');
    const outputValue = document.getElementById('output-value');

    let modifiers = [];
    let totalValue = 0;

    addModifierBtn.addEventListener('click', function() {
        const modifierDiv = document.createElement('div');
        const modifierSelect = document.createElement('select');
        const pointsInput = document.createElement('input');
        const removeBtn = document.createElement('button');

        const modifierOptions = ['Number of Targets', 'Range', 'Area', 'Damage', 'Extra Effect'];

        modifierOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            modifierSelect.appendChild(opt);
        });

        pointsInput.type = 'number';
        pointsInput.value = 0;
        pointsInput.min = 0;

        removeBtn.textContent = 'Remove';
        removeBtn.style.marginLeft = '10px';
        removeBtn.style.backgroundColor = '#dc3545';
        removeBtn.style.color = '#fff';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '4px';
        removeBtn.style.cursor = 'pointer';

        modifierDiv.appendChild(modifierSelect);
        modifierDiv.appendChild(pointsInput);
        modifierDiv.appendChild(removeBtn);

        modifierList.appendChild(modifierDiv);

        const modifierObject = { modifierSelect, pointsInput };
        modifiers.push(modifierObject);

        pointsInput.addEventListener('input', updateSkill);
        removeBtn.addEventListener('click', function() {
            const index = modifiers.indexOf(modifierObject);
            if (index !== -1) {
                modifiers.splice(index, 1);
            }
            modifierDiv.remove();
            updateSkill();
        });

        updateSkill();
    });

    skillNameInput.addEventListener('input', updateSkill);
    skillDescriptionInput.addEventListener('input', updateSkill);
    resourceTypeSelect.addEventListener('change', updateSkill);

    function updateSkill() {
        const skillName = skillNameInput.value;
        const skillDescription = skillDescriptionInput.value;
        const resourceType = resourceTypeSelect.value;

        outputName.textContent = skillName;
        outputDescription.textContent = skillDescription;
        outputResource.textContent = resourceType;

        let modifiersText = '';
        totalValue = 0;

        modifiers.forEach(mod => {
            const modifierName = mod.modifierSelect.value;
            const points = parseInt(mod.pointsInput.value, 10) || 0;
            modifiersText += `${modifierName}: ${points} points<br>`;
            totalValue += points;
        });

        outputModifiers.innerHTML = modifiersText;
        outputValue.textContent = totalValue;
    }
});
