import React from 'react'
import { usePools } from './usePools'
import Box from '@material-ui/core/Box'
import { PoolRow } from './PoolRow'
import { Link } from 'react-router-dom'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import IconButton from '@material-ui/core/IconButton'

export const useStyles = makeStyles(theme => ({
  box: {
    boxShadow: theme.boxShadow.inner,
    transition: 'all 0.15s ease-out',
    borderRadius: '3rem'
  },
  table: {
    width: '100%'
  },
  thLink: {
    cursor: 'pointer',
    textDecoration: 'none'
  },
  filters: {
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column'
    },
  },
  filterImageContainer: {

  },
  filterImage: {
    width: '18px',
    '&[data-disabled="true"]': {
       filter: 'grayscale(0.8)'
    }
  },
  hideMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
  }
}))

export function PoolsOverview () {
  const styles = useStyles()
  const { pools, userPools, filterTokens, filterChains, toggleFilterToken, toggleFilterChain, toggleColumnSort } = usePools()

  function handleTokenToggleFilterFn (symbol: string) {
    return (event: any) => {
      event.preventDefault()
      toggleFilterToken(symbol)
    }
  }

  function handleChainToggleFilterFn (slug: string) {
    return (event: any) => {
      event.preventDefault()
      toggleFilterChain(slug)
    }
  }

  function handleColumnSortFn(column: string) {
    return (event: any) => {
      event.preventDefault()
      toggleColumnSort(column)
    }
  }

  return (
    <Box maxWidth={"900px"} m={"0 auto"}>
      <Box mb={4} p={1} textAlign="left">
        <Typography variant="h4">
          Add liquidity to earn trading fees and rewards.
        </Typography>
      </Box>
      {userPools.length > 0 && (
        <Box className={styles.box} p={4} mb={6}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box p={1} textAlign="left">
              <Typography variant="h5">
                My Pools
              </Typography>
            </Box>
          </Box>
          <Box overflow="auto">
            <table className={styles.table}>
              <tr>
                <th>
                  <Box p={1} textAlign="left">
                    <Typography variant="subtitle2" color="secondary">
                      Pool
                    </Typography>
                  </Box>
                </th>
                <th>
                  <Box p={1} textAlign="left">
                    <Typography variant="subtitle2" color="secondary">
                    My Liquidity
                    </Typography>
                  </Box>
                </th>
                <th className={styles.hideMobile}>
                  <Box p={1} textAlign="left">
                    <Typography variant="subtitle2" color="secondary">
                    TVL
                    </Typography>
                  </Box>
                </th>
                <th className={styles.hideMobile}>
                  <Box p={1} textAlign="left">
                    <Typography variant="subtitle2" color="secondary">
                    Total APR
                    </Typography>
                  </Box>
                </th>
                <th>
                  <Box p={1} textAlign="left">
                    <Typography variant="subtitle2" color="secondary">
                    Action
                    </Typography>
                  </Box>
                </th>
              </tr>
              {userPools.map((data: any) => {
                return (
                  <PoolRow data={data} />
                )
              })}
            </table>
          </Box>
        </Box>
      )}
      <Box className={styles.box} p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box p={1} textAlign="left">
            <Typography variant="h5">
              All Pools
            </Typography>
          </Box>
          <Box display="flex" className={styles.filters}>
            <Box display="flex" alignItems="center" mr={2}>
              <Box mr={1}>
                <Typography variant="subtitle2">
                  Tokens:
                </Typography>
              </Box>
              <Box display="flex">
                {filterTokens.map((x) => {
                  return (
                    <Box display="flex" className={styles.filterImageContainer}>
                      <IconButton onClick={handleTokenToggleFilterFn(x.symbol)} size="small" >
                        <img className={styles.filterImage} src={x.imageUrl} alt={x.symbol} data-disabled={!x.enabled} />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box>
                <Typography variant="subtitle2">
                  Networks:
                </Typography>
              </Box>
              <Box display="flex">
                {filterChains.map((x) => {
                  return (
                    <Box display="flex" className={styles.filterImageContainer}>
                      <IconButton onClick={handleChainToggleFilterFn(x.slug)} size="small">
                        <img className={styles.filterImage} src={x.imageUrl} alt={x.name} data-disabled={!x.enabled} />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
        </Box>
        <Box overflow="auto">
          <table className={styles.table}>
            <tr>
              <th>
                <Box p={1} textAlign="left">
                  <Typography variant="subtitle2" color="secondary">
                    Pool
                  </Typography>
                </Box>
              </th>
              <th className={styles.hideMobile}>
                <Box p={1} textAlign="left">
                  <a className={styles.thLink} onClick={handleColumnSortFn('userBalance')}>
                    <Typography variant="subtitle2" color="secondary">
                    My Liquidity
                    </Typography>
                  </a>
                </Box>
              </th>
              <th className={styles.hideMobile}>
                <Box p={1} textAlign="left">
                  <a className={styles.thLink} onClick={handleColumnSortFn('tvl')}>
                    <Typography variant="subtitle2" color="secondary">
                    TVL
                    </Typography>
                  </a>
                </Box>
              </th>
              <th>
                <Box p={1} textAlign="left">
                  <a className={styles.thLink} onClick={handleColumnSortFn('totalApr')}>
                    <Typography variant="subtitle2" color="secondary">
                    Total APR
                    </Typography>
                  </a>
                </Box>
              </th>
              <th>
                <Box p={1} textAlign="left">
                  <Typography variant="subtitle2" color="secondary">
                   Action
                  </Typography>
                </Box>
              </th>
            </tr>
            {pools.map((data: any) => {
              return (
                <PoolRow data={data} isAllPools />
              )
            })}
          </table>
        </Box>
      </Box>
    </Box>
  )
}