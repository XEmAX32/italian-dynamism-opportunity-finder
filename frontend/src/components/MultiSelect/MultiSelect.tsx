import React from 'react';
import './MultiSelect.css';
// import Dropdown from './dropdown.png'; // import your dropdown image from material icons! ;)

const MultiSelect = ({ options, selected, toggleOption }) => {
  console.log(...options.filter((option) => selected.includes(option.id)).map((option) => option.title))
  return (
      <div className="c-multi-select-dropdown magicBorder">
          <div className="c-multi-select-dropdown__selected">
                {selected.length > 0 ? <div>{...options.filter((option) => selected.includes(option.id)).map((option, id) => option.title+(selected.length != (id+1) ? ', ' : ''))}</div> : <div>select categories</div>}
                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path fill="white" d="M12 15l-4.243-4.243 1.415-1.414L12 12.172l2.828-2.829 1.415 1.414z"/>
                    </g>
            </svg>
          </div>
          <ul className="c-multi-select-dropdown__options">
              {options.map(option => {
                  const isSelected = selected.includes(option.id);

                  return (
                      <li className="c-multi-select-dropdown__option" onClick={() => toggleOption({ id: option.id })}>
                          <input type="checkbox" checked={isSelected} className="c-multi-select-dropdown__option-checkbox"></input>
                          <span>{option.title}</span>
                      </li>
                  )
              })}
          </ul>
      </div>
  )
}

export default MultiSelect;