import React from 'react'
import styled from 'styled-components'

/**
 * @author Robert Long
 */
export const ListItem = (styled as any).li`
  display: flex;
  flex-direction: row;
  outline: none;
  overflow: hidden;
  user-select: none;
  min-height: 24px;
  padding: 0 4px;
  align-items: center;
  color: var(--textColor);

  background-color: ${(props) => (props.selected ? 'var(--dropdownMenuHoverBackground)' : 'var(--panel2)')};

  :nth-child(odd) {
    background-color: ${(props) => (props.selected ? 'var(--dropdownMenuHoverBackground)' : 'var(--dock)')};
  }

  :hover,
  :focus {
    background-color: ${(props) => (props.selected ? 'var(--blueHover)' : 'var(--dropdownMenuHoverBackground)')};
    color: var(--textColor);
  }

  :active {
    background-color: var(--bluePressed);
    color: var(--textColor);
  }
`

/**
 *
 * @author Robert Long
 */
const ListItemIcon = (styled as any).div`
  width: 12px;
  height: 12px;
  margin-right: 4px;
`

/**
 *
 * @author Robert Long
 * @param {any} iconComponent
 * @param {any} children
 * @param {any} rest
 * @returns
 */
export function IconListItem({ iconComponent, children, ...rest }) {
  return (
    <ListItem {...rest}>
      <ListItemIcon as={iconComponent} />
      {children}
    </ListItem>
  )
}

export const List = (styled as any).ul`
  height: 100%;
  overflow-y: auto;
`
