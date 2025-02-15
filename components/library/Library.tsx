import { GeneralToolbar } from 'components/app/GeneralToolbar';
import { formatRelative } from 'date-fns';
import { Illuminsight } from 'types';
import InfiniteScroll from 'react-infinite-scroller';
import localForage from 'localforage';
import * as React from 'react';
import { Cover } from 'components/library/Cover';
import { Link } from 'react-router-dom';
import { Tags } from 'components/library/Tags';
import Fuse from 'fuse.js';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Star as StarIcon,
} from '@material-ui/icons';
import {
  InputAdornment,
  createStyles,
  IconButton,
  makeStyles,
  Typography,
  TextField,
  ListItem,
  Button,
  Hidden,
  Drawer,
  Theme,
  List,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    selectedTagAvatar: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
    infiniteScroll: {
      overflowY: 'auto',
      height: '100%',
      flex: 1,
    },
    importSample: {
      textAlign: 'center',
    },
    drawerPaper: {
      zIndex: theme.zIndex.appBar - 1,
      width: 240,
    },
    pubAuthors: {
      marginBottom: '0.3em',
      fontSize: '110%',
      color: theme.palette.getContrastText(theme.palette.background.default),
    },
    pubName: {
      fontSize: '150%',
      display: 'flex',
      color: theme.palette.getContrastText(theme.palette.background.default),
    },
    pubInfo: {
      fontSize: '100%',
      color: theme.palette.grey[500],
    },
    toolbar: theme.mixins.toolbar,
    content: {
      [theme.breakpoints.up('sm')]: {
        marginLeft: 240,
      },
      flexDirection: 'column',
      display: 'flex',
    },
    pub: {
      textDecoration: 'none',
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: 240,
        flexShrink: 0,
      },
    },
    root: {
      flexDirection: 'column',
      padding: theme.spacing(3),
      display: 'flex',
    },
  }),
);

export function Library(): JSX.Element {
  const [selectedTags, setSelectedTags] = React.useState<
    Illuminsight.Tag['id'][]
  >([]);
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [pubs, setPubs] = React.useState<Illuminsight.Pub[]>([]);
  const [tags, setTags] = React.useState<Illuminsight.Tag[]>([]);
  const [page, setPage] = React.useState(0);
  const classes = useStyles();
  const now = new Date();

  // Load pubs and tags from local storage on mount
  React.useEffect(() => {
    localForage
      .getItem('tag-list')
      .then((tags) => {
        if (tags !== null) setTags(tags as Illuminsight.Tag[]);
        return localForage.getItem('pub-list');
      })
      .then((pubs) => setPubs((pubs as Illuminsight.Pub[]) || []))
      .catch((err) => console.error(err));
  }, []);

  // Filter by tags
  let matches = selectedTags.length
    ? pubs.filter((pub) => {
        for (const tag of selectedTags) {
          if (!pub.tags.includes(tag)) return false;
        }
        return true;
      })
    : pubs;

  // Filter by search
  if (search) {
    const fuse = new Fuse(matches, {
      shouldSort: true,
      threshold: 0.4,
      keys: ['name', 'link', 'authors'],
    });
    matches = fuse.search(search);
  }

  // Starred items stick to top
  matches = matches.sort((a, b) => {
    if (!a.starred && b.starred) return 1;
    if (a.starred && !b.starred) return -1;
    return 0;
  });

  // Only load enough for "pages"
  const paginatedMatches = matches.slice(0, (page + 1) * 5);

  return (
    <div className={classes.root}>
      <GeneralToolbar />

      {/* Fixed / temporary drawer for tags */}
      <div className={classes.drawer}>
        <Hidden smUp>
          {/* Temporary drawer for narrow screens */}
          <Drawer
            open={showDrawer}
            anchor="left"
            variant="temporary"
            onClose={(): void => setShowDrawer(false)}
            classes={{ paper: classes.drawerPaper }}
          >
            <Tags
              setSelectedTags={setSelectedTags}
              selectedTags={selectedTags}
              matches={matches}
              tags={tags}
            />
          </Drawer>
        </Hidden>

        {/* Permanent drawer for wide screens */}
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{ paper: classes.drawerPaper }}
            variant="permanent"
            open
          >
            <div className={classes.toolbar} />
            <Tags
              setSelectedTags={setSelectedTags}
              selectedTags={selectedTags}
              matches={matches}
              tags={tags}
            />
          </Drawer>
        </Hidden>
      </div>

      <div className={classes.content}>
        {/* Search field */}
        <TextField
          id="search"
          label="Search"
          value={search}
          margin="normal"
          variant="outlined"
          onChange={(e): void => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <Hidden smUp>
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Show filters"
                    onClick={(): void => setShowDrawer(true)}
                    color="secondary"
                  >
                    <FilterIcon />
                  </IconButton>
                </InputAdornment>
              </Hidden>
            ),
          }}
          placeholder="A Tale of Two Cities"
        />

        {/* Import sample library */}
        {pubs.length ? null : (
          <p className={classes.importSample}>
            You do not have any books.
            <Button href="/import/sample">Import sample library?</Button>
          </p>
        )}

        {/* Display matching pubs */}
        <div className={classes.infiniteScroll}>
          <InfiniteScroll
            useWindow={false}
            threshold={25}
            loadMore={(p): void => setPage(p)}
            hasMore={matches.length > paginatedMatches.length}
            loader={<Typography key="loader">...</Typography>}
          >
            <List dense>
              {paginatedMatches.map((match) => (
                <Link
                  to={`/read/${match.id}`}
                  key={match.id}
                  className={classes.pub}
                >
                  <ListItem button>
                    <Cover id={match.id} />
                    <div>
                      <Typography className={classes.pubName} variant="h2">
                        {match.starred ? <StarIcon color="primary" /> : null}
                        {match.name}
                      </Typography>
                      {match.authors ? (
                        <Typography className={classes.pubAuthors}>
                          {match.authors}
                        </Typography>
                      ) : null}
                      <Typography className={classes.pubInfo}>
                        Added {formatRelative(match.id, now)}
                      </Typography>
                      <Typography className={classes.pubInfo}>
                        {match.words} words
                      </Typography>
                      <Typography className={classes.pubInfo}>
                        {match.tags
                          .map(
                            (tag) =>
                              `#${
                                (tags.find(
                                  (t) => t.id == tag,
                                ) as Illuminsight.Tag).name
                              }`,
                          )
                          .join(' ')}
                      </Typography>
                    </div>
                  </ListItem>
                </Link>
              ))}
            </List>
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
}
