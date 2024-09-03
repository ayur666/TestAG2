document.addEventListener('DOMContentLoaded', function() {
    const addModifierBtn = document.getElementById('add-modifier');
    const modifierList = document.getElementById('modifier-list');
    const skillNameInput = document.getElementById('skill-name');
    const skillDescriptionInput = document.getElementById('skill-description');
    const skillFantasyInput = document.getElementById('skill-fantasy');
    const attributeTypeSelect = document.getElementById('attribute-type');
    const resourceTypeSelect = document.getElementById('resource-type');
    const costTypeSelect = document.getElementById('cost-type');
    const outputName = document.getElementById('output-name');
    const outputDescription = document.getElementById('output-description');
    const outputFantasy = document.getElementById('output-fantasy');
    const outputAttribute = document.getElementById('output-attribute');
    const outputAttributeCost = document.getElementById('output-attribute-cost');
    const outputResource = document.getElementById('output-resource');
    const outputResourceCost = document.getElementById('output-resource-cost');
    const outputModifiers = document.getElementById('output-modifiers');
    const outputValue = document.getElementById('output-value');
    const outputValueCost = document.getElementById('output-value-cost');
    const outputResourceCostType = document.getElementById('output-resource-cost-type');

    let modifiers = [];
    let totalValue = 0;

    addModifierBtn.addEventListener('click', function() {
        const modifierDiv = document.createElement('div');
        const modifierSelect = document.createElement('select');
        const pointsInput = document.createElement('input');
        const removeBtn = document.createElement('button');

        const modifierOptions = ['Number of Targets', 'Range', 'Area', 'Damage', 'Extra Effect', 'Number of Objects Created'];

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

        const modifierObject = { modifierSelect, pointsInput, extra: null };
        modifiers.push(modifierObject);

        pointsInput.addEventListener('input', updateSkill);
        modifierSelect.addEventListener('change', function() {
            handleExtraOptions(modifierObject, modifierDiv);
            updateSkill();
        });
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
    skillFantasyInput.addEventListener('input', updateSkill);
    attributeTypeSelect.addEventListener('change', updateSkill);
    resourceTypeSelect.addEventListener('change', updateSkill);
    costTypeSelect.addEventListener('change', updateSkill);

    function handleExtraOptions(modifierObject, modifierDiv) {
        const selectedModifier = modifierObject.modifierSelect.value;

        if (modifierObject.extra) {
            modifierDiv.removeChild(modifierObject.extra);
            modifierObject.extra = null;
        }

        if (selectedModifier === 'Damage') {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'modifier-extra';

            const damageTypeSelect = document.createElement('select');
            const damageTypes = ['Blunt', 'Slashing', 'Piercing', 'Nature', 'Light', 'Shadow', 'Fire', 'Water', 'Air', 'Earth', 'Variable'];

            damageTypes.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                damageTypeSelect.appendChild(opt);
            });

            const damageDeliverySelect = document.createElement('select');
            const deliveryTypes = ['Direct', 'Over Time', 'Delayed'];

            deliveryTypes.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                damageDeliverySelect.appendChild(opt);
            });

            const damageDescription = document.createElement('textarea');
            damageDescription.placeholder = 'Describe the damage...';

            extraDiv.innerHTML = `<label>Damage Type:</label>`;
            extraDiv.appendChild(damageTypeSelect);
            extraDiv.innerHTML += `<label>Delivery Method:</label>`;
            extraDiv.appendChild(damageDeliverySelect);
            extraDiv.innerHTML += `<label>Damage Description:</label>`;
            extraDiv.appendChild(damageDescription);

            modifierDiv.appendChild(extraDiv);
            modifierObject.extra = extraDiv;
        } else if (selectedModifier === 'Extra Effect') {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'modifier-extra';

            const effectTypeSelect = document.createElement('select');
            const effectTypes = ['Beneficial', 'Negative', 'Situational'];

            effectTypes.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                effectTypeSelect.appendChild(opt);
            });

            const effectDescription = document.createElement('textarea');
            effectDescription.placeholder = 'Describe the effect...';

            extraDiv.innerHTML = `<label>Effect Type:</label>`;
            extraDiv.appendChild(effectTypeSelect);
            extraDiv.innerHTML += `<label>Effect Description:</label>`;
            extraDiv.appendChild(effectDescription);

            modifierDiv.appendChild(extraDiv);
            modifierObject.extra = extraDiv;
        }

        updateSkill();
    }

    function updateSkill() {
        const skillName = skillNameInput.value;
        const skillDescription = skillDescriptionInput.value;
        const skillFantasy = skillFantasyInput.value;
        const attributeType = attributeTypeSelect.value;
        const resourceType = resourceTypeSelect.value;
        const costType = costTypeSelect.value;

        outputName.textContent = skillName;
        outputDescription.textContent = skillDescription;
        outputFantasy.textContent = skillFantasy;
        outputAttribute.textContent = attributeType;
        outputAttributeCost.textContent = attributeType;
        outputResource.textContent = resourceType;
        outputResourceCost.textContent = resourceType;
        outputResourceCostType.textContent = costType;

        let modifiersText = '';
        totalValue = 0;

        modifiers.forEach(mod => {
            const modifierName = mod.modifierSelect.value;
            const points = parseInt(mod.pointsInput.value, 10) || 0;
            let modifierDescription = `${modifierName}: ${points}`;

            if (modifierName === 'Area' || modifierName === 'Range') {
                modifierDescription += ` meters`;
            } else if (modifierName === 'Damage' && mod.extra) {
                const damageType = mod.extra.querySelector('select').value;
                const deliveryType = mod.extra.querySelectorAll('select')[1].value;
                const description = mod.extra.querySelector('textarea').value;
                modifierDescription += ` (${damageType}, ${deliveryType}): ${description}`;
            } else if (modifierName === 'Extra Effect' && mod.extra) {
                const effectType = mod.extra.querySelector('select').value;
                const description = mod.extra.querySelector('textarea').value;
                if(effectType === 'Negative') {
                    modifierDescription = `${modifierName}: Saving throw difficulty increased by ${points}` ;
                } else if(effectType === 'Beneficial') {
                    modifierDescription = `${modifierName}: Value increased by ${points}`;
                }
                modifierDescription += ` (${effectType}): ${description}`;
            }

            modifiersText += modifierDescription + '<br>';
            totalValue += points;
        });

        outputModifiers.innerHTML = modifiersText;
        outputValue.textContent = totalValue;
        outputValueCost.textContent = totalValue;
    }
});
